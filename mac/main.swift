import Cocoa
import WebKit

/// GUIA_URL só serve pra testar contra o servidor local (ex.: http://localhost:3001).
let base = ProcessInfo.processInfo.environment["GUIA_URL"] ?? "https://creativehome-gamma.vercel.app"
let home = URL(string: "\(base)/admin")!
let host = home.host ?? "creativehome-gamma.vercel.app"

if CommandLine.arguments.contains("--ler-discos") {
    print(Discos.relatorio())
    exit(0)
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var web: WKWebView!
    let leitor = Leitor()
    var itensIntervalo: [NSMenuItem] = []
    static let opcoesIntervalo: [(String, Int)] = [
        ("A cada 10 minutos", 10), ("A cada 30 minutos", 30), ("A cada hora", 60), ("Só quando eu pedir", 0),
    ]
    var minutosIntervalo: Int { UserDefaults.standard.object(forKey: "intervaloPastasMin") as? Int ?? 30 }
    let onboarding = Onboarding()
    // Tela de carregamento por cima da página: spinner enquanto abre, aviso com "Tentar de novo" se falhar.
    let carregando = NSStackView()
    let giro = NSProgressIndicator()
    let aviso = NSTextField(labelWithString: "Carregando…")
    let tentar = NSButton(title: "Tentar de novo", target: nil, action: nil)

    func applicationDidFinishLaunching(_ n: Notification) {
        leitor.intervaloPastas = TimeInterval(minutosIntervalo * 60)
        buildMenu()
        // A tela Armazenamento fala com o app por window.webkit.messageHandlers.guia.
        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "guia")
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        // Barra de título transparente: o gradiente do sistema aparece por trás dos botões da janela,
        // e a página começa abaixo deles (contentLayoutGuide), então o logo não fica por baixo.
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 860),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered, defer: false)
        window.title = "CreativeHome"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        // Fundo do sistema (o gradiente do body) atrás da página: antes do carregamento e no
        // "puxão" da rolagem o WKWebView mostrava preto.
        let fundo = NSView()
        fundo.wantsLayer = true
        let gradiente = CAGradientLayer()
        func cor(_ hex: Int) -> CGColor {
            let r = CGFloat((hex >> 16) & 0xff) / 255
            let g = CGFloat((hex >> 8) & 0xff) / 255
            let b = CGFloat(hex & 0xff) / 255
            return NSColor(red: r, green: g, blue: b, alpha: 1).cgColor
        }
        gradiente.colors = [cor(0xa3452b), cor(0xb8622f), cor(0xc78a3d)]
        gradiente.startPoint = CGPoint(x: 0, y: 1)
        gradiente.endPoint = CGPoint(x: 1, y: 0)
        gradiente.autoresizingMask = [.layerWidthSizable, .layerHeightSizable]
        fundo.layer = gradiente
        web.setValue(false, forKey: "drawsBackground")
        web.underPageBackgroundColor = NSColor(red: 0.72, green: 0.38, blue: 0.18, alpha: 1)
        web.translatesAutoresizingMaskIntoConstraints = false
        fundo.addSubview(web)
        window.contentView = fundo
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: (window.contentLayoutGuide as! NSLayoutGuide).topAnchor),
            web.leadingAnchor.constraint(equalTo: fundo.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: fundo.trailingAnchor),
            web.bottomAnchor.constraint(equalTo: fundo.bottomAnchor),
        ])
        montarCarregando(em: fundo)
        window.backgroundColor = NSColor(red: 0.72, green: 0.38, blue: 0.18, alpha: 1)
        window.setFrameAutosaveName("principal")
        window.center()
        window.makeKeyAndOrderFront(nil)
        web.load(URLRequest(url: home))

        leitor.enviar = { [weak self] dados, fim in self?.enviarLeitura(dados, fim) }
        leitor.iniciar()
        onboarding.mostrarSePrimeiraVez()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool { true }

    func applicationShouldHandleReopen(_ app: NSApplication, hasVisibleWindows: Bool) -> Bool {
        window.makeKeyAndOrderFront(nil)
        return true
    }

    // MARK: discos

    /// Entrega a leitura dos discos ao site, usando a sessão já logada no WKWebView.
    func enviarLeitura(_ dados: [String: Any], _ fim: @escaping (Bool) -> Void) {
        guard web.url?.host == host else { return fim(false) }
        let js = """
        const r = await fetch('/api/armazenamento/leitura', {
            method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(dados)});
        return r.status;
        """
        web.callAsyncJavaScript(js, arguments: ["dados": dados], in: nil, in: .page) { result in
            if case .success(let v) = result, let status = v as? Int, status == 200 { fim(true) } else { fim(false) }
        }
    }

    @objc func lerDiscosAgora() { leitor.ler(varrer: true) }

    /// Escolha do menu "Sincronizar pastas automaticamente": guarda e vale já, sem reabrir o app.
    @objc func escolherIntervalo(_ item: NSMenuItem) {
        UserDefaults.standard.set(item.tag, forKey: "intervaloPastasMin")
        leitor.intervaloPastas = TimeInterval(item.tag * 60)
        itensIntervalo.forEach { $0.state = $0.tag == item.tag ? .on : .off }
    }

    /// Pedido da página: `{acao: "sincronizar", key}` lê as pastas só daquele disco, ou de todos os conectados
    /// se `key` for "todos", e avisa a página ao terminar.
    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.request.url?.host == host,
            let corpo = message.body as? [String: Any], corpo["acao"] as? String == "sincronizar",
            let key = corpo["key"] as? String
        else { return }
        leitor.ler(varrer: true, soKey: key == "todos" ? nil : key) { [weak self] ok in
            let js = "window.dispatchEvent(new CustomEvent('guia-sync', {detail: {key, ok}}))"
            self?.web.callAsyncJavaScript(js, arguments: ["key": key, "ok": ok], in: nil, in: .page) { _ in }
        }
    }

    @objc func mostrarPermissoes() { onboarding.mostrar() }

    // MARK: carregamento

    func montarCarregando(em fundo: NSView) {
        giro.style = .spinning
        giro.controlSize = .large
        giro.appearance = NSAppearance(named: .darkAqua)
        giro.startAnimation(nil)
        aviso.font = .systemFont(ofSize: 15, weight: .medium)
        aviso.textColor = .white
        tentar.bezelStyle = .rounded
        tentar.target = self
        tentar.action = #selector(recarregar)
        tentar.isHidden = true
        carregando.orientation = .vertical
        carregando.alignment = .centerX
        carregando.spacing = 14
        [giro, aviso, tentar].forEach(carregando.addArrangedSubview)
        carregando.translatesAutoresizingMaskIntoConstraints = false
        fundo.addSubview(carregando)
        NSLayoutConstraint.activate([
            carregando.centerXAnchor.constraint(equalTo: fundo.centerXAnchor),
            carregando.centerYAnchor.constraint(equalTo: fundo.centerYAnchor),
        ])
    }

    func mostrarCarregando(_ texto: String, falhou: Bool) {
        aviso.stringValue = texto
        tentar.isHidden = !falhou
        giro.isHidden = falhou
        if !falhou { giro.startAnimation(nil) }
        carregando.isHidden = false
        web.alphaValue = 0
    }

    // MARK: navegação

    func webView(_ w: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        // Só na abertura: nas navegações seguintes o próprio site já mostra o carregamento.
        if w.url == nil { mostrarCarregando("Carregando…", falhou: false) }
    }

    func webView(_ w: WKWebView, didFinish navigation: WKNavigation!) {
        carregando.isHidden = true
        web.alphaValue = 1
        leitor.ler(varrer: false)
    }

    func webView(_ w: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        mostrarCarregando("Não consegui abrir o sistema. Confira a internet.", falhou: true)
    }

    func webView(_ w: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        mostrarCarregando("A página não terminou de carregar.", falhou: true)
    }

    /// Fora do domínio (Drive, Google etc.) abre no navegador padrão.
    func webView(
        _ w: WKWebView, decidePolicyFor action: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        if let url = action.request.url, let h = url.host, h != host,
            action.navigationType == .linkActivated || action.targetFrame == nil
        {
            NSWorkspace.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }

    // target=_blank no mesmo domínio carrega na própria janela.
    func webView(
        _ w: WKWebView, createWebViewWith c: WKWebViewConfiguration,
        for action: WKNavigationAction, windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if let url = action.request.url {
            if url.host == host { w.load(action.request) } else { NSWorkspace.shared.open(url) }
        }
        return nil
    }

    // MARK: menu

    @objc func recarregar() {
        // Depois de uma falha a página fica sem URL; reload() não faz nada, então recarrega a inicial.
        if web.url == nil { web.load(URLRequest(url: home)) } else { web.reload() }
    }

    func buildMenu() {
        let main = NSMenu()
        func item(_ title: String, _ sel: Selector?, _ key: String = "", target: AnyObject? = nil) -> NSMenuItem {
            let i = NSMenuItem(title: title, action: sel, keyEquivalent: key)
            i.target = target
            return i
        }
        func submenu(_ title: String, _ items: [NSMenuItem]) {
            let holder = NSMenuItem(); let m = NSMenu(title: title)
            items.forEach(m.addItem); holder.submenu = m; main.addItem(holder)
        }
        let intervalos = NSMenu(title: "Sincronizar pastas automaticamente")
        itensIntervalo = AppDelegate.opcoesIntervalo.map { titulo, min in
            let i = item(titulo, #selector(escolherIntervalo(_:)), target: self)
            i.tag = min
            i.state = min == minutosIntervalo ? .on : .off
            intervalos.addItem(i)
            return i
        }
        let itemIntervalo = NSMenuItem(title: "Sincronizar pastas automaticamente", action: nil, keyEquivalent: "")
        itemIntervalo.submenu = intervalos
        submenu("App", [
            item("Permissões…", #selector(mostrarPermissoes), target: self),
            item("Ler discos agora", #selector(lerDiscosAgora), "l", target: self),
            itemIntervalo,
            .separator(),
            item("Ocultar", #selector(NSApplication.hide(_:)), "h"),
            item("Sair", #selector(NSApplication.terminate(_:)), "q"),
        ])
        submenu("Editar", [
            item("Desfazer", Selector(("undo:")), "z"),
            item("Refazer", Selector(("redo:")), "Z"),
            .separator(),
            item("Recortar", #selector(NSText.cut(_:)), "x"),
            item("Copiar", #selector(NSText.copy(_:)), "c"),
            item("Colar", #selector(NSText.paste(_:)), "v"),
            item("Selecionar Tudo", #selector(NSText.selectAll(_:)), "a"),
        ])
        submenu("Visualizar", [
            item("Recarregar", #selector(recarregar), "r", target: self),
            item("Tela Cheia", #selector(NSWindow.toggleFullScreen(_:)), "f"),
        ])
        submenu("Janela", [item("Minimizar", #selector(NSWindow.miniaturize(_:)), "m")])
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()

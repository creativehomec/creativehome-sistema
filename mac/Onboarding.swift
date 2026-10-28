import Cocoa
import UserNotifications
import ServiceManagement

/// Janela de boas-vindas: pede, numa tela só, tudo que o app precisa do macOS.
/// Abre na primeira vez e pode ser reaberta em App › Permissões.
final class Onboarding: NSObject {
    static let chave = "onboardingConcluido"

    private struct Estado {
        let ok: Bool
        let texto: String
        let botao: String?
    }

    private final class Linha {
        let titulo: String
        let descricao: String
        let simbolo: String
        let verificar: (@escaping (Estado) -> Void) -> Void
        let agir: (@escaping () -> Void) -> Void
        let status = NSTextField(labelWithString: "")
        let botao = NSButton(title: "", target: nil, action: nil)
        let icone = NSImageView()

        init(
            _ titulo: String, _ descricao: String, simbolo: String,
            verificar: @escaping (@escaping (Estado) -> Void) -> Void,
            agir: @escaping (@escaping () -> Void) -> Void
        ) {
            self.titulo = titulo
            self.descricao = descricao
            self.simbolo = simbolo
            self.verificar = verificar
            self.agir = agir
        }
    }

    private var window: NSWindow?
    private var linhas: [Linha] = []
    /// O macOS só pergunta pelos discos quando alguém tenta abri-los; só tentamos depois do toque.
    private var discosTocado = false
    private var notificacao: UNAuthorizationStatus = .notDetermined

    private static func abrirAjustes(_ url: String) {
        if let u = URL(string: url) { NSWorkspace.shared.open(u) }
    }

    override init() {
        super.init()
        linhas = [
            Linha(
                "Notificações",
                "Avisa quando chega algo novo: aprovação de cliente, mensagem, cobrança.",
                simbolo: "bell.badge",
                verificar: { [weak self] fim in
                    UNUserNotificationCenter.current().getNotificationSettings { s in
                        DispatchQueue.main.async {
                            self?.notificacao = s.authorizationStatus
                            switch s.authorizationStatus {
                            case .authorized, .provisional:
                                fim(Estado(ok: true, texto: "Pronto", botao: nil))
                            case .denied:
                                fim(Estado(ok: false, texto: "Bloqueado. Libere nos Ajustes do Mac.", botao: "Abrir ajustes"))
                            default:
                                fim(Estado(ok: false, texto: "Ainda não permitido", botao: "Permitir"))
                            }
                        }
                    }
                },
                agir: { [weak self] depois in
                    if self?.notificacao == .notDetermined {
                        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
                            DispatchQueue.main.async { depois() }
                        }
                    } else {
                        Onboarding.abrirAjustes("x-apple.systempreferences:com.apple.Notifications-Settings.extension")
                        depois()
                    }
                }),
            Linha(
                "Discos e SSDs",
                "Lê quanto espaço cada disco tem e quais pastas estão nele, pra avisar quando o espaço acabar ou algo só existir num lugar.",
                simbolo: "externaldrive",
                verificar: { [weak self] fim in
                    guard self?.discosTocado == true else {
                        return fim(Estado(ok: false, texto: "Toque em Permitir e o Mac vai perguntar", botao: "Permitir"))
                    }
                    DispatchQueue.global(qos: .userInitiated).async {
                        let a = Discos.acesso()
                        DispatchQueue.main.async {
                            switch a {
                            case .ok:
                                fim(Estado(ok: true, texto: "Pronto: consigo ler os discos", botao: nil))
                            case .semDisco:
                                fim(Estado(ok: false, texto: "Conecte um SSD e toque em Verificar", botao: "Verificar"))
                            case .negado:
                                fim(Estado(ok: false, texto: "Bloqueado. Ative o CreativeHome em Acesso Total ao Disco.", botao: "Abrir ajustes"))
                            }
                        }
                    }
                },
                agir: { [weak self] depois in
                    let jaTocou = self?.discosTocado == true
                    self?.discosTocado = true
                    DispatchQueue.global(qos: .userInitiated).async {
                        // Abrir o disco é o que faz o macOS perguntar; se já foi negado, só os Ajustes resolvem.
                        let a = Discos.acesso()
                        DispatchQueue.main.async {
                            if a == .negado && jaTocou {
                                Onboarding.abrirAjustes("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")
                            }
                            depois()
                        }
                    }
                }),
            Linha(
                "Abrir ao ligar o Mac",
                "Assim o app já está rodando e lendo os discos, sem você lembrar de abrir.",
                simbolo: "power",
                verificar: { fim in
                    switch SMAppService.mainApp.status {
                    case .enabled:
                        fim(Estado(ok: true, texto: "Pronto", botao: nil))
                    case .requiresApproval:
                        fim(Estado(ok: false, texto: "Aprove em Ajustes › Itens de Início", botao: "Abrir ajustes"))
                    default:
                        fim(Estado(ok: false, texto: "Desligado", botao: "Ativar"))
                    }
                },
                agir: { depois in
                    if SMAppService.mainApp.status == .requiresApproval {
                        SMAppService.openSystemSettingsLoginItems()
                    } else {
                        try? SMAppService.mainApp.register()
                    }
                    depois()
                }),
        ]
        NotificationCenter.default.addObserver(
            forName: NSApplication.didBecomeActiveNotification, object: nil, queue: .main
        ) { [weak self] _ in self?.atualizar() }
    }

    func mostrarSePrimeiraVez() {
        if !UserDefaults.standard.bool(forKey: Onboarding.chave) { mostrar() }
    }

    func mostrar() {
        if window == nil { window = montar() }
        NSApp.activate(ignoringOtherApps: true)
        window?.center()
        window?.makeKeyAndOrderFront(nil)
        atualizar()
    }

    private func atualizar() {
        guard window?.isVisible == true else { return }
        for linha in linhas {
            linha.verificar { estado in
                linha.status.stringValue = estado.texto
                linha.status.textColor = estado.ok ? .systemGreen : .secondaryLabelColor
                linha.icone.contentTintColor = estado.ok ? .systemGreen : .labelColor
                linha.botao.isHidden = estado.botao == nil
                linha.botao.title = estado.botao ?? ""
            }
        }
    }

    @objc private func tocou(_ sender: NSButton) {
        guard let linha = linhas.first(where: { $0.botao === sender }) else { return }
        linha.agir { [weak self] in
            // O macOS leva um instante pra refletir a escolha.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self?.atualizar() }
        }
    }

    @objc private func concluir() {
        UserDefaults.standard.set(true, forKey: Onboarding.chave)
        window?.close()
    }

    private func montar() -> NSWindow {
        func texto(_ s: String, _ fonte: NSFont, _ cor: NSColor = .labelColor) -> NSTextField {
            let t = NSTextField(wrappingLabelWithString: s)
            t.font = fonte
            t.textColor = cor
            return t
        }

        let pilha = NSStackView()
        pilha.orientation = .vertical
        pilha.alignment = .leading
        pilha.spacing = 18
        pilha.edgeInsets = NSEdgeInsets(top: 32, left: 32, bottom: 28, right: 32)

        pilha.addArrangedSubview(texto("Bem-vindo ao CreativeHome", .systemFont(ofSize: 22, weight: .semibold)))
        pilha.addArrangedSubview(
            texto("O Mac vai pedir três permissões. Leva um minuto e você só faz isso uma vez.", .systemFont(ofSize: 13), .secondaryLabelColor))

        for linha in linhas {
            linha.icone.image = NSImage(systemSymbolName: linha.simbolo, accessibilityDescription: linha.titulo)
            linha.icone.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 22, weight: .regular)
            linha.icone.setContentHuggingPriority(.required, for: .horizontal)
            linha.icone.widthAnchor.constraint(equalToConstant: 34).isActive = true

            linha.status.font = .systemFont(ofSize: 12, weight: .medium)
            let textos = NSStackView(views: [
                texto(linha.titulo, .systemFont(ofSize: 14, weight: .semibold)),
                texto(linha.descricao, .systemFont(ofSize: 12), .secondaryLabelColor),
                linha.status,
            ])
            textos.orientation = .vertical
            textos.alignment = .leading
            textos.spacing = 3

            linha.botao.bezelStyle = .rounded
            linha.botao.target = self
            linha.botao.action = #selector(tocou(_:))
            linha.botao.setContentHuggingPriority(.required, for: .horizontal)

            let linhaView = NSStackView(views: [linha.icone, textos, linha.botao])
            linhaView.orientation = .horizontal
            linhaView.alignment = .centerY
            linhaView.spacing = 14
            pilha.addArrangedSubview(linhaView)
            linhaView.widthAnchor.constraint(equalTo: pilha.widthAnchor, constant: -64).isActive = true
        }

        let concluir = NSButton(title: "Concluir", target: self, action: #selector(concluir))
        concluir.bezelStyle = .rounded
        concluir.keyEquivalent = "\r"
        pilha.addArrangedSubview(concluir)

        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 560, height: 10),
            styleMask: [.titled, .closable], backing: .buffered, defer: false)
        w.title = "Permissões"
        w.isReleasedWhenClosed = false
        let vista = NSView()
        vista.addSubview(pilha)
        pilha.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            pilha.topAnchor.constraint(equalTo: vista.topAnchor),
            pilha.leadingAnchor.constraint(equalTo: vista.leadingAnchor),
            pilha.trailingAnchor.constraint(equalTo: vista.trailingAnchor),
            pilha.bottomAnchor.constraint(equalTo: vista.bottomAnchor),
            vista.widthAnchor.constraint(equalToConstant: 560),
        ])
        w.contentView = vista
        return w
    }
}

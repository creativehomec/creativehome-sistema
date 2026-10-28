import Cocoa

/// Um disco montado no Mac (SSD externo, cartão...), com o espaço dele.
struct VolumeLido {
    let key: String
    let name: String
    let url: URL
    let capacityGb: Double
    let usedGb: Double

    /// Mesmo formato que a rota /api/armazenamento/leitura espera.
    var json: [String: Any] {
        ["key": key, "name": name, "capacityGb": capacityGb, "usedGb": usedGb]
    }
}

enum Acesso { case semDisco, ok, negado }

enum Discos {
    /// Pastas de sistema que nunca são material do estúdio.
    static let ignorar: Set<String> = ["lost+found", "$RECYCLE.BIN", "System Volume Information"]

    /// Discos locais montados, menos o do próprio Mac. GB é decimal (1 TB = 1000 GB), como na etiqueta do disco.
    static func listar() -> [VolumeLido] {
        let keys: [URLResourceKey] = [
            .volumeNameKey, .volumeUUIDStringKey, .volumeTotalCapacityKey,
            .volumeAvailableCapacityKey, .volumeIsRootFileSystemKey, .volumeIsLocalKey,
        ]
        let urls = FileManager.default.mountedVolumeURLs(
            includingResourceValuesForKeys: keys, options: [.skipHiddenVolumes]) ?? []
        return urls.compactMap { url in
            guard !url.path.hasPrefix("/System/"),
                let v = try? url.resourceValues(forKeys: Set(keys)),
                v.volumeIsRootFileSystem != true, v.volumeIsLocal == true,
                let total = v.volumeTotalCapacity, total > 0,
                let livre = v.volumeAvailableCapacity
            else { return nil }
            let nome = v.volumeName ?? url.lastPathComponent
            return VolumeLido(
                key: v.volumeUUIDString ?? nome, name: nome, url: url,
                capacityGb: Double(total) / 1e9, usedGb: Double(total - livre) / 1e9)
        }
    }

    /// Cada pasta de primeiro nível é um material; as pastas dentro dela (um nível) vão junto, sem arquivos.
    /// Lança se o macOS negar a leitura do disco.
    static func pastas(_ volume: VolumeLido) throws -> [[String: Any]] {
        let itens = try FileManager.default.contentsOfDirectory(
            at: volume.url, includingPropertiesForKeys: [.isDirectoryKey, .isSymbolicLinkKey],
            options: [.skipsHiddenFiles])
        return itens.compactMap { url in
            let v = try? url.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
            guard v?.isDirectory == true, v?.isSymbolicLink != true,
                !ignorar.contains(url.lastPathComponent)
            else { return nil }
            let (total, subs) = detalhe(url)
            return ["name": url.lastPathComponent, "sizeGb": Double(total) / 1e9, "subfolders": subs]
        }
    }

    /// Tamanho total da pasta e, separado, o de cada subpasta direta (as 40 maiores).
    static func detalhe(_ pasta: URL) -> (Int, [[String: Any]]) {
        let keys: [URLResourceKey] = [.isDirectoryKey, .isSymbolicLinkKey, .isRegularFileKey, .totalFileAllocatedSizeKey]
        let filhos = (try? FileManager.default.contentsOfDirectory(
            at: pasta, includingPropertiesForKeys: keys, options: [])) ?? []
        var total = 0
        var subs: [(String, Int)] = []
        for f in filhos {
            guard let v = try? f.resourceValues(forKeys: Set(keys)), v.isSymbolicLink != true else { continue }
            if v.isDirectory == true {
                let t = tamanho(f)
                total += t
                if !f.lastPathComponent.hasPrefix(".") { subs.append((f.lastPathComponent, t)) }
            } else if v.isRegularFile == true {
                total += v.totalFileAllocatedSize ?? 0
            }
        }
        subs.sort { $0.1 > $1.1 }
        return (total, subs.prefix(40).map { ["name": $0.0, "sizeGb": Double($0.1) / 1e9] })
    }

    /// Espaço que a pasta ocupa de fato no disco, somando tudo que há dentro.
    static func tamanho(_ pasta: URL) -> Int {
        let keys: [URLResourceKey] = [.totalFileAllocatedSizeKey, .isRegularFileKey]
        guard
            let en = FileManager.default.enumerator(
                at: pasta, includingPropertiesForKeys: keys, options: [], errorHandler: { _, _ in true })
        else { return 0 }
        var total = 0
        for case let url as URL in en {
            guard let v = try? url.resourceValues(forKeys: Set(keys)), v.isRegularFile == true else { continue }
            total += v.totalFileAllocatedSize ?? 0
        }
        return total
    }

    /// Consegue abrir os discos conectados? Tocar num disco sem permissão faz o macOS perguntar.
    static func acesso() -> Acesso {
        let vols = listar()
        if vols.isEmpty { return .semDisco }
        for v in vols where (try? FileManager.default.contentsOfDirectory(atPath: v.url.path)) == nil {
            return .negado
        }
        return .ok
    }

    /// Para teste na linha de comando: `CreativeHome --ler-discos`.
    static func relatorio() -> String {
        let volumes: [[String: Any]] = listar().map { v in
            var d = v.json
            if let p = try? pastas(v) { d["folders"] = p } else { d["erro"] = "sem permissão para ler as pastas" }
            return d
        }
        let data = try? JSONSerialization.data(
            withJSONObject: ["volumes": volumes], options: [.prettyPrinted, .sortedKeys])
        return data.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
    }
}

/// Lê os discos de tempos em tempos e entrega ao site: espaço a cada 5 minutos e
/// pastas no intervalo escolhido no menu (padrão 30 min; 0 = só quando pedir),
/// além de na abertura e ao ligar/desligar um disco.
/// Também lê só um disco quando a tela pede (botão "Sincronizar este disco").
final class Leitor {
    private struct Tarefa {
        let varrer: Bool
        let soKey: String?
        let fim: ((Bool) -> Void)?
    }

    /// Entrega os dados ao site; chama `fim(true)` se ele aceitou.
    var enviar: (([String: Any], @escaping (Bool) -> Void) -> Void)?
    /// Segundos entre leituras de pastas; 0 desliga a automática.
    var intervaloPastas: TimeInterval = 1800
    private var timer: Timer?
    private var lendo = false
    private var fila: [Tarefa] = []
    private var ultimaVarredura = Date.distantPast
    private var ultimaLeitura = Date.distantPast

    func iniciar() {
        let nc = NSWorkspace.shared.notificationCenter
        for n in [NSWorkspace.didMountNotification, NSWorkspace.didUnmountNotification] {
            nc.addObserver(forName: n, object: nil, queue: .main) { [weak self] _ in self?.ler(varrer: true) }
        }
        timer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in self?.tick() }
        ler(varrer: true)
    }

    /// Roda a cada minuto e decide o que está na hora: pastas no intervalo escolhido, senão só o espaço a cada 5 min.
    private func tick() {
        let agora = Date()
        if intervaloPastas > 0, agora.timeIntervalSince(ultimaVarredura) >= intervaloPastas - 30 {
            ler(varrer: true)
        } else if agora.timeIntervalSince(ultimaLeitura) >= 300 {
            ler(varrer: false)
        }
    }

    /// `soKey`: lê as pastas só desse disco (os outros mandam só o espaço). `fim` diz se o site aceitou.
    func ler(varrer: Bool, soKey: String? = nil, fim: ((Bool) -> Void)? = nil) {
        if lendo {
            // Leitura do mesmo tipo já esperando não precisa repetir; pedido de disco sempre entra.
            if soKey != nil || fim != nil || (varrer && !fila.contains { $0.varrer && $0.soKey == nil }) {
                fila.append(Tarefa(varrer: varrer, soKey: soKey, fim: fim))
            }
            return
        }
        lendo = true
        ultimaLeitura = Date()
        DispatchQueue.global(qos: .utility).async { [weak self] in
            let vols = Discos.listar()
            DispatchQueue.main.async {
                guard let self else { return }
                let rapido = vols.map { $0.json }
                self.enviar?(["volumes": rapido]) { ok in
                    // Se o site não aceitou (deslogado, sem rede), ler pasta por pasta seria trabalho perdido.
                    guard varrer, ok else {
                        fim?(ok)
                        return self.terminar()
                    }
                    DispatchQueue.global(qos: .utility).async {
                        var completo = rapido
                        for (i, v) in vols.enumerated() where soKey == nil || soKey == v.key {
                            // Sem permissão, não manda `folders`: lista vazia apagaria os materiais do disco.
                            if let p = try? Discos.pastas(v) { completo[i]["folders"] = p }
                        }
                        DispatchQueue.main.async {
                            self.enviar?(["volumes": completo]) { ok2 in
                                if ok2 && soKey == nil { self.ultimaVarredura = Date() }
                                fim?(ok2)
                                self.terminar()
                            }
                        }
                    }
                }
            }
        }
    }

    private func terminar() {
        lendo = false
        if !fila.isEmpty {
            let t = fila.removeFirst()
            ler(varrer: t.varrer, soKey: t.soKey, fim: t.fim)
        }
    }
}

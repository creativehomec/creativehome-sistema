import Foundation

/// Roda o google-maps-scraper-kit neste Mac e devolve o CSV. O site (na Vercel) não consegue:
/// precisa de Chrome e de minutos de execução. Quem chama é a página, pela ponte `guia`.
enum Prospeccao {
    struct Pedido {
        let nicho: String
        let cidade: String
        let profundidade: Int
        let minNota: Double
        let semSite: Bool
        let comTelefone: Bool
        let comEmail: Bool
        let cidadeInteira: Bool

        init?(_ corpo: [String: Any]) {
            guard let nicho = (corpo["nicho"] as? String)?.trimmingCharacters(in: .whitespaces),
                let cidade = (corpo["cidade"] as? String)?.trimmingCharacters(in: .whitespaces),
                !nicho.isEmpty, !cidade.isEmpty, nicho.count <= 80, cidade.count <= 80,
                // Começar com "-" viraria flag do scrape.py.
                !nicho.hasPrefix("-"), !cidade.hasPrefix("-")
            else { return nil }
            self.nicho = nicho
            self.cidade = cidade
            let p = (corpo["profundidade"] as? Int) ?? 3
            profundidade = [1, 3, 5].contains(p) ? p : 3
            let n = (corpo["minNota"] as? Double) ?? 0
            minNota = (4...5).contains(n) ? n : 0
            semSite = corpo["semSite"] as? Bool ?? false
            comTelefone = corpo["comTelefone"] as? Bool ?? false
            comEmail = corpo["comEmail"] as? Bool ?? false
            cidadeInteira = corpo["cidadeInteira"] as? Bool ?? false
        }

        /// Mesmos argumentos que a rota /api/prospeccao monta.
        var argumentos: [String] {
            var a = ["scripts/scrape.py", "\(nicho) em \(cidade)", "--city", cidade, "--lang", "pt", "--country", "br"]
            a += cidadeInteira ? ["--grid", "3", "--depth", "6"] : ["--depth", String(profundidade)]
            if minNota > 0 { a += ["--min-rating", String(minNota)] }
            if semSite { a.append("--no-website") }
            if comTelefone { a.append("--has-phone") }
            if comEmail { a.append("--has-email") }
            return a
        }
    }

    static var pastaDoKit: URL {
        if let env = ProcessInfo.processInfo.environment["GMAPS_KIT_DIR"] { return URL(fileURLWithPath: env) }
        return FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".agents/google-maps-scraper-kit")
    }

    /// App aberto pelo Finder não herda o PATH do terminal: procura o Python nos lugares de sempre.
    static func python() -> String? {
        [
            "/Library/Frameworks/Python.framework/Versions/Current/bin/python3",
            "/opt/homebrew/bin/python3", "/usr/local/bin/python3", "/usr/bin/python3",
        ].first { FileManager.default.isExecutableFile(atPath: $0) }
    }

    /// Roda fora da thread principal. `fim` recebe o CSV ou o texto do erro, na thread principal.
    static func buscar(_ pedido: Pedido, fim: @escaping (Result<String, Erro>) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            let resultado = rodar(pedido)
            DispatchQueue.main.async { fim(resultado) }
        }
    }

    struct Erro: Error { let texto: String }

    private static func rodar(_ pedido: Pedido) -> Result<String, Erro> {
        let kit = pastaDoKit
        guard FileManager.default.fileExists(atPath: kit.appendingPathComponent("scripts/scrape.py").path) else {
            return .failure(Erro(texto: "Scraper não instalado neste Mac (pasta \(kit.path))."))
        }
        guard let py = python() else {
            return .failure(Erro(texto: "Python 3 não encontrado. Instale em python.org."))
        }
        // Liga o motor se estiver parado; se já estiver rodando o comando só confirma.
        _ = executar(py, ["scripts/engine.py", "start"], em: kit, limite: 120)

        let pasta = FileManager.default.temporaryDirectory.appendingPathComponent("prospeccao-\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: pasta, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: pasta) }
        let saida = pasta.appendingPathComponent("leads.csv")

        let r = executar(py, pedido.argumentos + ["--out", saida.path], em: kit, limite: 580)
        guard r.status == 0, let csv = try? String(contentsOf: saida, encoding: .utf8) else {
            let fim = r.texto.split(separator: "\n").suffix(3).joined(separator: " ")
            return .failure(Erro(texto: "A busca falhou. \(fim)".trimmingCharacters(in: .whitespaces)))
        }
        return .success(csv)
    }

    /// Sem shell: os argumentos vão como lista, então nicho/cidade não viram comando.
    private static func executar(_ exe: String, _ args: [String], em pasta: URL, limite: TimeInterval) -> (status: Int32, texto: String) {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: exe)
        p.arguments = args
        p.currentDirectoryURL = pasta
        let cano = Pipe()
        p.standardOutput = cano
        p.standardError = cano
        do { try p.run() } catch { return (-1, "\(error)") }
        // Lê enquanto roda: se ninguém esvazia o cano, o script trava ao enchê-lo.
        var buffer = Data()
        let leitura = DispatchQueue(label: "prospeccao.leitura")
        let pronto = DispatchSemaphore(value: 0)
        leitura.async {
            buffer = cano.fileHandleForReading.readDataToEndOfFile()
            pronto.signal()
        }
        let prazo = DispatchTime.now() + limite
        if pronto.wait(timeout: prazo) == .timedOut {
            p.terminate()
            return (-2, "tempo esgotado")
        }
        p.waitUntilExit()
        return (p.terminationStatus, String(decoding: buffer.suffix(2000), as: UTF8.self))
    }
}

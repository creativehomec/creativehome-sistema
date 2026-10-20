import Cocoa

// Gera icon.icns: a inicial da marca em branco sobre o terracota (mesmo ícone do iPhone, app/apple-icon.tsx).
// Uso: swiftc gerar-icone.swift -o /tmp/gerar-icone && /tmp/gerar-icone && iconutil -c icns icon.iconset
let pasta = "icon.iconset"
try? FileManager.default.removeItem(atPath: pasta)
try! FileManager.default.createDirectory(atPath: pasta, withIntermediateDirectories: true)

func png(_ px: Int, _ nome: String) {
    let img = NSImage(size: NSSize(width: px, height: px))
    img.lockFocus()
    let s = CGFloat(px)
    // Margem de ~10% e canto arredondado, como os ícones do macOS.
    let r = NSRect(x: s * 0.1, y: s * 0.1, width: s * 0.8, height: s * 0.8)
    NSColor(red: 0xa4 / 255, green: 0x4a / 255, blue: 0x2b / 255, alpha: 1).setFill()
    NSBezierPath(roundedRect: r, xRadius: s * 0.18, yRadius: s * 0.18).fill()
    let attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: s * 0.5, weight: .bold), .foregroundColor: NSColor.white,
    ]
    let t = NSAttributedString(string: "C", attributes: attrs)
    let z = t.size()
    t.draw(at: NSPoint(x: (s - z.width) / 2, y: (s - z.height) / 2))
    img.unlockFocus()
    let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(pasta)/\(nome).png"))
}

let tamanhos: [(Int, String)] = [
    (16, "icon_16x16"), (32, "icon_16x16@2x"), (32, "icon_32x32"), (64, "icon_32x32@2x"),
    (128, "icon_128x128"), (256, "icon_128x128@2x"), (256, "icon_256x256"), (512, "icon_256x256@2x"),
    (512, "icon_512x512"), (1024, "icon_512x512@2x"),
]
for (px, nome) in tamanhos { png(px, nome) }

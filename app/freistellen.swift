// Freistellen: Hintergrund eines Fotos entfernen (Vision, macOS 14+). Aufruf: freistellen <ein> <aus.png>
import AppKit
import CoreImage
import Foundation
import Vision

let a = CommandLine.arguments
guard a.count == 3 else { exit(1) }
guard let bild = CIImage(contentsOf: URL(fileURLWithPath: a[1]), options: [.applyOrientationProperty: true]) else { exit(2) }
if #available(macOS 14.0, *) {
    let anfrage = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(ciImage: bild)
    do { try handler.perform([anfrage]) } catch { exit(3) }
    guard let ergebnis = anfrage.results?.first, !ergebnis.allInstances.isEmpty else { exit(4) }
    do {
        let puffer = try ergebnis.generateMaskedImage(ofInstances: ergebnis.allInstances, from: handler,
                                                      croppedToInstancesExtent: true)
        let aus = CIImage(cvPixelBuffer: puffer)
        try CIContext().writePNGRepresentation(of: aus, to: URL(fileURLWithPath: a[2]), format: .RGBA8,
                                               colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    } catch { exit(5) }
} else { exit(6) }

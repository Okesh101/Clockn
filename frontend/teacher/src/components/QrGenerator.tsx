import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export const QrGenerator: React.FC = () => {
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedQrString, setGeneratedQrString] = useState<string | null>(
    null,
  );

  // 1. Create a reference to grab the active SVG DOM element
  const qrRef = useRef<SVGSVGElement>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName) return;

    setLoading(true);
    setStatusMessage("Capturing GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          location: locationName.trim(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const response = await fetch("/api/v1/qrcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const resData = await response.json();

          if (response.ok) {
            setStatusMessage("✅ Registered successfully!");
            setGeneratedQrString(resData.data.qr_string);
          } else {
            setStatusMessage(`❌ Failed: ${resData.message}`);
          }
        } catch (error) {
          setStatusMessage("❌ Network error.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setStatusMessage("❌ Turn on GPS.");
      },
      { enableHighAccuracy: true },
    );
  };

  // 2. Function to convert the rendered SVG component into a file download
  const downloadQrCode = () => {
    if (!qrRef.current) return;

    const svgElement = qrRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    // Cleans up spaces in the file name
    downloadLink.download = `QR_${locationName.trim().replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl); // Clean up memory
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-2xl shadow-xl mt-10 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
        Register Location
      </h2>

      {!generatedQrString ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              placeholder="e.g., Main Entrance Gate"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md"
          >
            {loading ? "Registering..." : "Capture GPS & Generate Secure QR"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4">
            {/* 3. Added the ref connection here */}
            <QRCodeSVG
              ref={qrRef}
              value={generatedQrString}
              size={200}
              level="H"
            />
          </div>

          {/* <p className="text-sm font-medium text-gray-700 mb-4">
            Location: {locationName}
          </p> */}

          {/* <div className="p-3 bg-gray-100 rounded-lg text-center w-full mb-4">
            <span className="text-[10px] text-gray-500 block font-mono">
              SECURE TOKEN IN QR:
            </span>
            <code className="text-xs font-mono text-gray-600 break-all">
              {generatedQrString}
            </code>
          </div> */}

          {/* 4. Action Button Row */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setGeneratedQrString(null);
                setLocationName("");
                setStatusMessage("");
              }}
              className="w-1/2 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all"
            >
              Reset Form
            </button>
            <button
              onClick={downloadQrCode}
              className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-95"
            >
              Download SVG
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <p className="mt-4 text-center font-semibold text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg">
          {statusMessage}
        </p>
      )}
    </div>
  );
};

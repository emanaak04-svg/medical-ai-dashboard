export default function Home() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* MAIN AREA */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <h1 className="text-lg font-semibold">Medical AI Dashboard</h1>

        {/* Dataset viewer placeholder */}
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Image Viewer
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            (image + bounding box / mask will go here)
          </div>
        </section>

        {/* JSON panel placeholder */}
        <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Generated JSON
          </h2>
          <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
            (structured record will go here)
          </div>
        </section>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 shrink-0 border-l border-gray-800 bg-gray-900 p-4 flex flex-col">
        <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-3">
          Dataset + Chat
        </h2>

        {/* Dataset selector placeholder */}
        <select className="mb-4 rounded bg-gray-800 border border-gray-700 p-2 text-sm">
          <option>RSNA Pneumonia</option>
          <option>VinDr-CXR</option>
          <option>HAM10000</option>
        </select>

        {/* Chat placeholder */}
        <div className="flex-1 rounded border border-gray-800 bg-gray-950 p-3 text-sm text-gray-500">
          (chat messages will appear here)
        </div>
      </aside>
    </div>
  );
}
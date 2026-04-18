export default function CameraPanel() {
  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-5 border border-slate-700/30">
      <h3 className="text-slate-400 text-sm font-semibold mb-3">Camera Feed</h3>
      <div className="bg-slate-950/60 rounded-xl aspect-video flex items-center justify-center border border-slate-700/20">
        <div className="text-center text-slate-600">
          <div className="text-3xl mb-2">{"\uD83D\uDCF7"}</div>
          <p className="text-sm">Camera feed will appear here</p>
          <p className="text-xs mt-1 text-slate-700">Connect a camera to enable visual monitoring</p>
        </div>
      </div>
    </div>
  );
}

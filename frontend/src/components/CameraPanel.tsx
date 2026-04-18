export default function CameraPanel() {
  return (
    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-slate-400 text-sm font-medium mb-3">Camera Feed</h3>
      <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center border border-slate-700/30">
        <div className="text-center text-slate-600">
          <div className="text-4xl mb-2">&#128247;</div>
          <p className="text-sm">Camera feed will appear here</p>
          <p className="text-xs mt-1">Connect a camera to enable visual monitoring</p>
        </div>
      </div>
    </div>
  );
}

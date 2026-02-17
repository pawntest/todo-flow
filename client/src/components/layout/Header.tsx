export const Header = () => {
  return (
    <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
      <div className="text-xs text-gray-500">
        <kbd className="px-2 py-1 bg-gray-100 rounded border">N</kbd> New task • 
        <kbd className="px-2 py-1 bg-gray-100 rounded border ml-2">⌘D</kbd> Detail panel
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export const EmptyState = ({ title, description, icon = '📝' }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
    </div>
  );
};

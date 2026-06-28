import Spinner from "@/components/ui/Spinner";

export default function EstimatorLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading Property Estimator…</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { trainer } from '../services/tensorflowTrainer';

export function TrainingInterface({ modelId }: { modelId: string }) {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startTraining = async () => {
    try {
      setError(null);
      setIsTraining(true);

      const config = {
        epochs: 50,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
        augmentation: false
      };

      // Initialize training
      const initData = await trainer.initializeTraining(modelId, config);

      // Start training
      const result = await trainer.trainModel(
        modelId,
        initData.datasets,
        config,
        (epoch, logs) => {
          setCurrentEpoch(epoch);
          setProgress((epoch / config.epochs) * 100);
          setMetrics(logs);
        }
      );

      console.log('Training complete:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-md">
      <h2 className="text-2xl font-bold mb-6">Train Your Model</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isTraining ? (
        <div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Training Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <p>Epoch: {currentEpoch} / 50</p>
          </div>

          {metrics && (
            <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
              <div className="flex justify-between">
                <span>Loss:</span>
                <span className="font-mono">{metrics.loss?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-mono">{(metrics.acc * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Val Loss:</span>
                <span className="font-mono">{metrics.val_loss?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Val Accuracy:</span>
                <span className="font-mono">{(metrics.val_acc * 100).toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={startTraining}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
        >
          Start Training
        </button>
      )}
    </div>
  );
}

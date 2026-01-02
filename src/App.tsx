import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { DatasetService } from './services/datasetService';
import { ModelService } from './services/modelService';
import { PredictionService } from './services/predictionService';
import { realClassifier } from './utils/realClassifier';
import { Header } from './components/Header';
import { Instructions } from './components/Instructions';
import { ImageUpload } from './components/ImageUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PredictionResults } from './components/PredictionResults';
import { DiseasesInfo } from './components/DiseasesInfo';
import { DatasetManager } from './components/DatasetManager';
import { TrainingProgress } from './components/TrainingProgress';
import ClimateRiskPredictor from './components/ClimateRiskPredictor';
import { PredictionResult } from './types/disease';
import { TrainingConfig } from './types/dataset';
import type { Dataset, Model } from './lib/supabase';
import { RefreshCw, Info, Database, Brain, MoreVertical, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] =
    useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<'predict' | 'dataset' | 'train' | 'climate'>('predict');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState({
    currentEpoch: 0,
    totalEpochs: 0,
    loss: 0,
    accuracy: 0,
    valLoss: 0,
    valAccuracy: 0,
    eta: '00:00:00',
  });

  const datasetService = new DatasetService();
  const modelService = new ModelService();
  const predictionService = new PredictionService();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated !== null) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [datasetsData, modelsData] = await Promise.all([
        datasetService.getDatasets(user?.id),
        modelService.getModels(user?.id),
      ]);
      setDatasets(datasetsData);
      setModels(modelsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAuthChange = (newUser: any) => {
    setUser(newUser);
    setIsAuthenticated(!!newUser);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setShowMenu(false);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setPredictionResult(null);
    setError(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPredictionResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();

      const result = await realClassifier.predict(
        selectedImage,
        selectedModel || undefined,
      );

      const processingTime = Date.now() - startTime;

      setPredictionResult(result);

      try {
        await predictionService.savePrediction(
          selectedImage,
          result,
          processingTime,
          selectedModel || undefined,
        );
      } catch (saveError) {
        console.warn('Failed to save prediction:', saveError);
      }
    } catch (err) {
      setError(
        'Failed to analyze the image. Please try again with a different image.',
      );
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPredictionResult(null);
    setError(null);
  };

  const handleDatasetUpload = async (
    files: File[],
    type: 'train' | 'test' | 'validation',
    name: string,
    description?: string,
  ) => {
    if (!user) {
      setError('Please sign in to upload datasets');
      return;
    }

    try {
      await datasetService.uploadDataset(files, type, name, description);
      await loadData();
      console.log(
        `Successfully uploaded ${files.length} images for ${type} dataset`,
      );
    } catch (error) {
      console.error('Failed to upload dataset:', error);
    }
  };

  const handleStartTraining = async (config: TrainingConfig) => {
    if (!user) {
      setError('Please sign in to train models');
      return;
    }

    try {
      const model = await modelService.createModel(
        `Apple Disease Model ${Date.now()}`,
        'CNN model trained on uploaded apple disease dataset',
        config,
      );

      setModels((prev) => [...prev, model]);
      setIsTraining(true);
      setTrainingProgress((prev) => ({
        ...prev,
        totalEpochs: config.epochs,
        currentEpoch: 0,
      }));

      await realClassifier.trainModel(model.id, config);

      setIsTraining(false);
      await loadData();
      console.log('Training completed!');
    } catch (error) {
      console.error('Training failed:', error);
      setError('Failed to start training. Please try again.');
      setIsTraining(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated === false && user === null) {
    return <Auth onAuthChange={handleAuthChange} />;
  }

  const handleOldStartTraining = async (config: TrainingConfig) => {
    setIsTraining(true);
    setTrainingProgress((prev) => ({
      ...prev,
      totalEpochs: config.epochs,
      currentEpoch: 0,
    }));

    for (let epoch = 1; epoch <= config.epochs; epoch++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setTrainingProgress({
        currentEpoch: epoch,
        totalEpochs: config.epochs,
        loss: Math.max(
          0.1,
          2.0 - (epoch / config.epochs) * 1.8 + Math.random() * 0.2,
        ),
        accuracy: Math.min(
          0.95,
          0.3 + (epoch / config.epochs) * 0.6 + Math.random() * 0.1,
        ),
        valLoss: Math.max(
          0.15,
          2.2 - (epoch / config.epochs) * 1.9 + Math.random() * 0.3,
        ),
        valAccuracy: Math.min(
          0.92,
          0.25 + (epoch / config.epochs) * 0.6 + Math.random() * 0.1,
        ),
        eta: `${Math.floor(((config.epochs - epoch) * 30) / 60)}:${String(
          ((config.epochs - epoch) * 30) % 60,
        ).padStart(2, '0')}:00`,
      });
    }

    setIsTraining(false);
    console.log('Training completed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header 
        user={user} 
        onSignOut={handleSignOut}
        onMenuItemClick={(section) => setActiveSection(section as any)}
      />

      {/* widened: let content stretch more */}
      <main className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs - ONLY Disease & Climate VISIBLE - CENTERED */}
        <div className="flex justify-center items-center mb-8">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {[
              { id: 'predict', label: 'Disease Prediction', icon: Brain },
              { id: 'climate', label: 'Climate Risk', icon: Info },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id as any);
                }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Disease Prediction Section */}
        {activeSection === 'predict' && (
          <>
            <Instructions />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Upload Apple Leaf
                  </h2>

                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    selectedImage={selectedImage}
                    onRemoveImage={handleRemoveImage}
                    isLoading={isLoading}
                  />

                  {selectedImage && !isLoading && !predictionResult && (
                    <div className="mt-6">
                      {models.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Model (Optional)
                          </label>
                          <select
                            value={selectedModel || ''}
                            onChange={(e) =>
                              setSelectedModel(e.target.value || null)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Use Default Model</option>
                            {models
                              .filter((m) => m.status === 'completed')
                              .map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={handlePredict}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Analyze Leaf for Diseases
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2">
                        <Info className="w-5 h-5 text-red-500" />
                        <p className="text-red-700 font-medium">
                          Analysis Failed
                        </p>
                      </div>
                      <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Analysis Results
                    </h2>
                    {predictionResult && (
                      <button
                        onClick={handleReset}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">New Analysis</span>
                      </button>
                    )}
                  </div>

                  {!selectedImage && !isLoading && !predictionResult && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg">
                        Upload an apple leaf image to see analysis results
                      </p>
                      <p className="text-sm mt-2">
                        Our AI will identify diseases and provide treatment
                        recommendations
                      </p>
                    </div>
                  )}

                  {isLoading && <LoadingSpinner />}

                  {predictionResult && (
                    <PredictionResults result={predictionResult} />
                  )}
                </div>
              </div>
            </div>

            <DiseasesInfo />
          </>
        )}

        {/* Climate Risk Section */}
        {activeSection === 'climate' && (
          <div className="mb-8">
            <ClimateRiskPredictor />
          </div>
        )}

        {/* Dataset Management Section */}
        {activeSection === 'dataset' && (
          <DatasetManager
            onDatasetUpload={handleDatasetUpload}
            datasets={datasets}
            models={models}
            onStartTraining={user ? handleStartTraining : handleOldStartTraining}
            isAuthenticated={!!user}
          />
        )}

        {/* Training Section */}
        {activeSection === 'train' && (
          <>
            <TrainingProgress
              isTraining={isTraining}
              currentEpoch={trainingProgress.currentEpoch}
              totalEpochs={trainingProgress.totalEpochs}
              loss={trainingProgress.loss}
              accuracy={trainingProgress.accuracy}
              valLoss={trainingProgress.valLoss}
              valAccuracy={trainingProgress.valAccuracy}
              eta={trainingProgress.eta}
            />

            <DatasetManager
              onDatasetUpload={handleDatasetUpload}
              datasets={datasets}
              models={models}
              onStartTraining={user ? handleStartTraining : handleOldStartTraining}
              isAuthenticated={!!user}
            />
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm">
              🍃 OrchardIntel: Apple Disease Detector with Planet Climate Risk Advisor • Powered by Advanced Computer Vision •
              For Educational and Research Purposes
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Always consult with agricultural professionals for critical crop
              decisions
            </p>
            <p className="text-xs mt-3 text-gray-500">
              Built by <span className="font-semibold">Zaid Shabir</span> •{' '}
              <a
                href="mailto:zaidshabir67@gmail.com"
                className="underline hover:text-gray-700"
              >
                zaidshabir67@gmail.com
              </a>{' '}
              •{' '}
              <a
                href="https://github.com/Zai14"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-gray-700"
              >
                github.com/Zai14
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

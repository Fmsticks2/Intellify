import IntellifyDemo from '../components/IntellifyDemo';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Intellify Wave 2
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience the future of decentralized AI knowledge companions. Upload documents, 
          interact with AI, and create your own AI NFTs (INFTs) with complete privacy and ownership.
        </p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Wave 2 Prototype Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                This is a prototype implementation. AI responses are mocked for demonstration purposes. 
                Real 0G Network integration will be available in Wave 3.
              </p>
            </div>
          </div>
        </div>
      </div>

      <IntellifyDemo />
    </div>
  );
}
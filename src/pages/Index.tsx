import { SceneProvider } from '@/store/SceneContext';
import TopToolbar from '@/components/TopToolbar';
import ObjectLibrary from '@/components/ObjectLibrary';
import SceneCanvas from '@/components/SceneCanvas';
import PropertiesPanel from '@/components/PropertiesPanel';

const Index = () => {
  return (
    <SceneProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        <TopToolbar />
        <div className="flex flex-1 overflow-hidden">
          <ObjectLibrary />
          <SceneCanvas />
          <PropertiesPanel />
        </div>
      </div>
    </SceneProvider>
  );
};

export default Index;

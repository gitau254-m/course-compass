import { AppProvider } from '@/contexts/AppContext';
import { AppShell } from '@/components/AppShell';

const Index = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default Index;
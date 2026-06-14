import Home from './app/page';
import { StoreProvider } from './lib/store';

export default function App() {
  return (
    <StoreProvider>
      <Home />
    </StoreProvider>
  );
}

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeoProcessorApp from '../components/GeoProcessorApp';

// Mock fetch
global.fetch = jest.fn();

// Suppress expected console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    // Suppress act() warnings
    if (message.includes('Warning: An update to') && message.includes('was not wrapped in act')) {
      return;
    }
    // Suppress expected error logs from the component (like "Error calling gateway")
    if (message.includes('Error calling gateway')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock dynamic import for MapView
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = () => <div data-testid="map-view">Map Component</div>;
    Component.displayName = 'MapView';
    return Component;
  },
}));

// Mock MapView component
jest.mock('../components/MapView', () => ({
  MapView: () => <div data-testid="map-view">Map Component</div>,
}));

describe('GeoProcessorApp', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render the main title', () => {
      render(<GeoProcessorApp />);

      expect(screen.getByText('Geo Processor UI')).toBeInTheDocument();
    });

    it('should render JSON mode card', () => {
      render(<GeoProcessorApp />);

      expect(screen.getByText('JSON Mode')).toBeInTheDocument();
      expect(screen.getByText('For developers and advanced users')).toBeInTheDocument();
    });

    it('should render Point Input Form', () => {
      render(<GeoProcessorApp />);

      expect(screen.getByText('Add Points')).toBeInTheDocument();
    });

    it('should render textarea with default example', () => {
      render(<GeoProcessorApp />);

      const textarea = screen.getByLabelText(/points \(json\)/i) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toContain('"points"');
    });

    it('should render Process button', () => {
      render(<GeoProcessorApp />);

      expect(screen.getByRole('button', { name: /process/i })).toBeInTheDocument();
    });

    it('should render Process button', () => {
      render(<GeoProcessorApp />);

      expect(screen.getByRole('button', { name: /process/i })).toBeInTheDocument();
    });
  });

  describe('JSON Mode Processing', () => {
    it('should successfully process valid JSON points', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        centroid: { lat: 31.9449667, lng: 21.5295 },
        bounds: { north: 40.7128, south: 19.4326, east: 139.6917, west: -99.1332 },
        points: [
          { lat: 19.4326, lng: -99.1332 },
          { lat: 40.7128, lng: -74.006 },
          { lat: 35.6895, lng: 139.6917 },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GeoProcessorApp />);

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/geo/process'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should show error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(<GeoProcessorApp />);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'invalid json');

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      expect(await screen.findByText(/invalid json format/i)).toBeInTheDocument();
    });

    it('should show error for empty textarea', async () => {
      const user = userEvent.setup();
      render(<GeoProcessorApp />);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      expect(screen.getByText(/please enter some json data/i)).toBeInTheDocument();
    });

    it('should show error when API returns error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid points data' }),
      });

      render(<GeoProcessorApp />);

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      expect(await screen.findByText(/invalid points data/i)).toBeInTheDocument();
    });

    it('should show error when network fails', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<GeoProcessorApp />);

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    });
  });

  describe('Form Mode Processing', () => {
    it('should process points from form mode', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        centroid: { lat: 40.7128, lng: -74.006 },
        bounds: { north: 40.7128, south: 40.7128, east: -74.006, west: -74.006 },
        points: [{ lat: 40.7128, lng: -74.006 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GeoProcessorApp />);

      // Add a point using form mode
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      const addButton = screen.getByRole('button', { name: /add point/i });

      await user.type(latInput, '40.7128');
      await user.type(lngInput, '-74.0060');
      await user.click(addButton);

      // Calculate
      const calculateButton = screen.getByRole('button', { name: /calculate \(1 point\)/i });
      await user.click(calculateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Results Display', () => {
    it('should display results after successful processing', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        centroid: { lat: 40.712800, lng: -74.006000 },
        bounds: { north: 50, south: 30, east: -60, west: -80 },
        points: [{ lat: 40.7128, lng: -74.006 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GeoProcessorApp />);

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should update textarea value when user types', async () => {
      const user = userEvent.setup();
      render(<GeoProcessorApp />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.clear(textarea);

      // Use fireEvent for JSON strings
      fireEvent.change(textarea, {
        target: { value: '{"points":[]}' }
      });

      expect(textarea.value).toBe('{"points":[]}');
    });

    it('should clear error when new valid input is provided', async () => {
      const user = userEvent.setup();
      render(<GeoProcessorApp />);

      // Trigger error
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.clear(textarea);
      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      expect(screen.getByText(/please enter some json data/i)).toBeInTheDocument();

      // Fix error - use fireEvent.change instead of user.type for JSON
      fireEvent.change(textarea, {
        target: { value: '{"points":[{"lat":10,"lng":20}]}' }
      });

      const mockResponse = {
        centroid: { lat: 10, lng: 20 },
        bounds: { north: 10, south: 10, east: 20, west: 20 },
        points: [{ lat: 10, lng: 20 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await user.click(processButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter some json data/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call the correct API endpoint', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        centroid: { lat: 10, lng: 20 },
        bounds: { north: 15, south: 5, east: 25, west: 15 },
        points: [{ lat: 10, lng: 20 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GeoProcessorApp />);

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/geo/process'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      // Wait for state update to complete
      await waitFor(() => {
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
      });
    });

    it('should send correct payload to API', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        centroid: { lat: 10, lng: 20 },
        bounds: { north: 15, south: 5, east: 25, west: 15 },
        points: [{ lat: 10, lng: 20 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<GeoProcessorApp />);

      const textarea = screen.getByLabelText(/points \(json\)/i) as HTMLTextAreaElement;
      await user.clear(textarea);

      // Use fireEvent.change for JSON strings
      fireEvent.change(textarea, {
        target: { value: '{"points":[{"lat":10,"lng":20}]}' }
      });

      const processButton = screen.getByRole('button', { name: /process/i });
      await user.click(processButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ points: [{ lat: 10, lng: 20 }] }),
          })
        );
      });

      // Wait for state update to complete
      await waitFor(() => {
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
      });
    });
  });
});

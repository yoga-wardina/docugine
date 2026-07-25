jest.mock('react-quill-new', () => () => <div data-testid="quill">Quill</div>);
jest.mock('react-quill-new/dist/quill.snow.css', () => ({}));
jest.mock('quill', () => {
  return class Quill {
    static import() {
      return { whitelist: [] };
    }
    static register() {}
  };
});

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the docugine editor', () => {
  render(<App />);
  const brand = screen.getByText(/Docugine/i);
  expect(brand).toBeInTheDocument();
});

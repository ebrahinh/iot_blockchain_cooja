import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // Simulates routing in tests
import App from './App';

test('renders Module3 component by default', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // Adjust based on Module3 content
  const module3Element = screen.getByText(/module3/i); // Replace with text from Module3 component
  expect(module3Element).toBeInTheDocument();
});

test('renders Module1 component when /module1 route is accessed', () => {
  render(
    <MemoryRouter initialEntries={['/module1']}>
      <App />
    </MemoryRouter>
  );
  // Adjust based on Module1 content
  const module1Element = screen.getByText(/module1/i); // Replace with text from Module1 component
  expect(module1Element).toBeInTheDocument();
});

test('renders Module2 component when /module2 route is accessed', () => {
  render(
    <MemoryRouter initialEntries={['/module2']}>
      <App />
    </MemoryRouter>
  );
  // Adjust based on Module2 content
  const module2Element = screen.getByText(/module2/i); // Replace with text from Module2 component
  expect(module2Element).toBeInTheDocument();
});

test('renders Module4 component when /module4 route is accessed', () => {
  render(
    <MemoryRouter initialEntries={['/module4']}>
      <App />
    </MemoryRouter>
  );
  // Adjust based on Module4 content
  const module4Element = screen.getByText(/module4/i); // Replace with text from Module4 component
  expect(module4Element).toBeInTheDocument();
});

test('renders Module5 component when /module5 route is accessed', () => {
  render(
    <MemoryRouter initialEntries={['/module5']}>
      <App />
    </MemoryRouter>
  );
  // Adjust based on Module5 content
  const module5Element = screen.getByText(/module5/i); // Replace with text from Module5 component
  expect(module5Element).toBeInTheDocument();
});

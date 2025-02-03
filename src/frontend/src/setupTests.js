import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Module1 from './module1';
import axios from 'axios';

jest.mock('axios');

describe('Module1 Component', () => {
  it('renders the sidebar', () => {
    render(<Module1 />);
    const sidebarElement = screen.getByText(/sidebar/i); // Replace with a text or element in your sidebar
    expect(sidebarElement).toBeInTheDocument();
  });

  it('fetches and displays IoT data from the API', async () => {
    // Mock API response
    const mockResponse = {
      data: [
        { Availability: 95, Usage: 150 },
        { Availability: 85, Usage: 130 },
      ],
    };

    axios.get.mockResolvedValueOnce(mockResponse);

    render(<Module1 />);

    // Assert API call is made
    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/module/comp1', {
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': 'ccd650ea-b2ba-4c37-ad05-9b3474992d3d' },
    });

    // Wait for chart data to update
    await waitFor(() => {
      const chartLabel = screen.getByText(/Devices Secured/i); // Adjust based on your dataset label
      expect(chartLabel).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<Module1 />);

    // Wait for any fallback UI or error messages
    await waitFor(() => {
      const errorMessage = screen.queryByText(/Error fetching data/i); // Adjust based on your error handling
      expect(errorMessage).toBeInTheDocument();
    });
  });
});

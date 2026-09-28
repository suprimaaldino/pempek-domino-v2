/// <reference types="jest" />

/**
 * Functional Tests for ProductCard Component
 * Tests: components/order/ProductCard.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/order/ProductCard';
import type { Product } from '@/types';
import { Timestamp } from 'firebase/firestore';

// Mock the order store.
//
// ProductCard subscribes with per-field selectors (so that adding an item only
// re-renders that one card), so the mock must honour the selector argument
// instead of returning the whole state.
const mockUpdateQuantity = jest.fn();
const mockAddItem = jest.fn();

interface MockItem {
  productId: string;
  quantity: number;
}
let mockItems: MockItem[] = [];

jest.mock('@/store/orderStore', () => ({
  useOrderStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      items: mockItems,
      updateQuantity: mockUpdateQuantity,
      addItem: mockAddItem,
    };
    return selector ? selector(state) : state;
  },
}));

// Mock next/image — strip next-only props (fill is boolean, invalid on <img>)
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, ...props }: any) => {
    // `alt` arrives via the spread, so a11y cannot verify it statically.
    /* eslint-disable jsx-a11y/alt-text */
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
    /* eslint-enable jsx-a11y/alt-text */
  },
}));

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Pempek Kapal Selam',
  description: 'Pempek besar dengan telur di dalamnya',
  price: 25000,
  imageUrl: '/images/pempek-kapal-selam.jpg',
  category: 'kecil',
  isActive: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItems = [];
  });

  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Pempek Kapal Selam')).toBeInTheDocument();
    expect(screen.getByText('Pempek besar dengan telur di dalamnya')).toBeInTheDocument();
    expect(screen.getByText('Rp 25.000')).toBeInTheDocument();
  });

  test('renders product image when available', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Pempek Kapal Selam');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/pempek-kapal-selam.jpg');
  });

  test('shows placeholder when no image is available', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: '' };
    render(<ProductCard product={productWithoutImage} />);

    // Should show utensils icon placeholder
    expect(screen.getByLabelText('Tambah Pempek Kapal Selam')).toBeInTheDocument();
  });

  test('calls addItem when clicking add button with 0 quantity', () => {
    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByLabelText('Tambah Pempek Kapal Selam');
    fireEvent.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith({
      productId: 'prod-1',
      productName: 'Pempek Kapal Selam',
      price: 25000,
    });
    expect(mockUpdateQuantity).not.toHaveBeenCalled();
  });

  test('displays quantity badge when item is in cart', () => {
    mockItems = [{ productId: 'prod-1', quantity: 3 }];
    render(<ProductCard product={mockProduct} />);

    expect(screen.getAllByText('3')[0]).toBeInTheDocument();
  });

  test('calls updateQuantity when incrementing existing item', () => {
    mockItems = [{ productId: 'prod-1', quantity: 2 }];

    render(<ProductCard product={mockProduct} />);

    const incrementButton = screen.getByLabelText('Tambah Pempek Kapal Selam');
    fireEvent.click(incrementButton);

    expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 3);
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  test('calls updateQuantity when decrementing item', () => {
    mockItems = [{ productId: 'prod-1', quantity: 2 }];

    render(<ProductCard product={mockProduct} />);

    const decrementButton = screen.getByLabelText('Kurangi Pempek Kapal Selam');
    fireEvent.click(decrementButton);

    expect(mockUpdateQuantity).toHaveBeenCalledWith('prod-1', 1);
  });

  test('displays correct quantity in controls', () => {
    mockItems = [{ productId: 'prod-1', quantity: 5 }];

    render(<ProductCard product={mockProduct} />);

    expect(screen.getAllByText('5')[0]).toBeInTheDocument();
  });

  test('applies correct border styling when item is in cart', () => {
    mockItems = [{ productId: 'prod-1', quantity: 1 }];

    const { container } = render(<ProductCard product={mockProduct} />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('border-primary/30');
  });

  test('applies default border styling when item is not in cart', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('border-neutral-100');
  });

  test('truncates long product names', () => {
    const longNameProduct = {
      ...mockProduct,
      name: 'Pempek Kapal Selam Spesial dengan Telur Ayam Kampung yang Sangat Enak dan Lezat',
    };

    render(<ProductCard product={longNameProduct} />);

    const nameElement = screen.getByText(/Pempek Kapal Selam/);
    expect(nameElement).toBeInTheDocument();
    expect(nameElement).toHaveClass('line-clamp-1');
  });

  test('truncates long descriptions', () => {
    const longDescProduct = {
      ...mockProduct,
      description: 'Ini adalah deskripsi yang sangat panjang tentang pempek yang sangat enak dan lezat dengan cuko yang khas dan rasa yang luar biasa',
    };

    render(<ProductCard product={longDescProduct} />);

    const descElement = screen.getByText(/Ini adalah deskripsi/);
    expect(descElement).toHaveClass('line-clamp-1');
  });

  test('handles rapid click events', () => {
    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByLabelText('Tambah Pempek Kapal Selam');
    
    // Click multiple times rapidly
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(mockAddItem).toHaveBeenCalledTimes(3);
  });

  test('product without description does not show description element', () => {
    const productNoDesc = { ...mockProduct, description: undefined };
    render(<ProductCard product={productNoDesc} />);

    // Description should not be rendered
    const description = screen.queryByText('Pempek besar dengan telur di dalamnya');
    expect(description).not.toBeInTheDocument();
  });
});

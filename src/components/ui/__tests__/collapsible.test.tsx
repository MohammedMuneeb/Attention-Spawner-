import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Collapsible } from '../collapsible';
import { Text } from 'react-native';

describe('Collapsible', () => {
  it('renders the title correctly', () => {
    const { getByText } = render(<Collapsible title='Test Title'><Text>Hidden Content</Text></Collapsible>);
    expect(getByText('Test Title')).toBeTruthy();
  });
});

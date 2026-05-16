import React, { createContext, useContext, ReactNode } from 'react';
import { useCartAnimation } from '../hooks/use-cart-animation';

interface AnimationContextType {
  triggerAnimation: (productElement: HTMLElement, productData: { image: string; name: string }) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const { triggerAnimation, AnimationLayer } = useCartAnimation();

  return (
    <AnimationContext.Provider value={{ triggerAnimation }}>
      {children}
      <AnimationLayer />
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
import { useState, useCallback } from 'react';

interface AnimationItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  image: string;
  name: string;
}

export const useCartAnimation = () => {
  const [animatingItems, setAnimatingItems] = useState<AnimationItem[]>([]);

  const triggerAnimation = useCallback((productElement: HTMLElement, productData: { image: string; name: string }) => {
    // Get cart icon position
    const cartIcon = document.querySelector('[data-cart-icon]') as HTMLElement;
    if (!cartIcon) return;

    const productRect = productElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const animationId = `${Date.now()}-${Math.random()}`;
    const newItem: AnimationItem = {
      id: animationId,
      startX: productRect.left + productRect.width / 2,
      startY: productRect.top + productRect.height / 2,
      endX: cartRect.left + cartRect.width / 2,
      endY: cartRect.top + cartRect.height / 2,
      image: productData.image,
      name: productData.name
    };

    setAnimatingItems(prev => [...prev, newItem]);

    // Remove animation after completion
    setTimeout(() => {
      setAnimatingItems(prev => prev.filter(item => item.id !== animationId));
    }, 1000);
  }, []);

  const AnimationLayer = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {animatingItems.map((item) => (
        <div
          key={item.id}
          className="absolute w-16 h-16 rounded-lg overflow-hidden shadow-lg animate-cart-fly"
          style={{
            left: item.startX - 32,
            top: item.startY - 32,
            '--start-x': `${item.startX}px`,
            '--start-y': `${item.startY}px`,
            '--end-x': `${item.endX}px`,
            '--end-y': `${item.endY}px`,
          } as React.CSSProperties}
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );

  return { triggerAnimation, AnimationLayer };
};
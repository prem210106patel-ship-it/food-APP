import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase.js';

const CartContext = createContext(null);

const CART_KEY = 'foodiehub_cart';
const FAVORITES_KEY = 'foodiehub_favorites';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantDeliveryFee, setRestaurantDeliveryFee] = useState(0);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setRestaurantId(parsed.restaurantId || null);
        setRestaurantName(parsed.restaurantName || '');
        setRestaurantDeliveryFee(parsed.restaurantDeliveryFee || 0);
      }
      const favs = localStorage.getItem(FAVORITES_KEY);
      if (favs) setFavorites(JSON.parse(favs));
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  const persist = useCallback((newItems, restId, restName, deliveryFee) => {
    localStorage.setItem(CART_KEY, JSON.stringify({
      items: newItems,
      restaurantId: restId,
      restaurantName: restName,
      restaurantDeliveryFee: deliveryFee,
    }));
  }, []);

  const addToCart = useCallback((food, restId, restName, deliveryFee, quantity = 1, customization = null) => {
    setItems(prev => {
      let newItems;
      let newRestId = restId;
      let newRestName = restName;
      let newFee = deliveryFee;

      if (restaurantId && restaurantId !== restId) {
        const replace = window.confirm(
          `Your cart has items from ${restaurantName}. Adding items from a different restaurant will clear your current cart. Do you want to continue?`
        );
        if (!replace) return prev;
        newItems = [];
      } else {
        newItems = [...prev];
      }

      const existingIdx = newItems.findIndex(i => i.food_id === food.id && JSON.stringify(i.customization) === JSON.stringify(customization));
      if (existingIdx >= 0) {
        newItems[existingIdx] = {
          ...newItems[existingIdx],
          quantity: newItems[existingIdx].quantity + quantity,
        };
      } else {
        newItems.push({
          food_id: food.id,
          name: food.name,
          price: food.price,
          image_url: food.image_url,
          quantity,
          customization,
        });
      }

      setRestaurantId(newRestId);
      setRestaurantName(newRestName);
      setRestaurantDeliveryFee(newFee);
      persist(newItems, newRestId, newRestName, newFee);
      return newItems;
    });
  }, [restaurantId, restaurantName, persist]);

  const updateQuantity = useCallback((foodId, quantity, customization = null) => {
    setItems(prev => {
      let newItems;
      if (quantity <= 0) {
        newItems = prev.filter(i => !(i.food_id === foodId && JSON.stringify(i.customization) === JSON.stringify(customization)));
      } else {
        newItems = prev.map(i =>
          i.food_id === foodId && JSON.stringify(i.customization) === JSON.stringify(customization)
            ? { ...i, quantity }
            : i
        );
      }
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName('');
        setRestaurantDeliveryFee(0);
        persist([], null, '', 0);
      } else {
        persist(newItems, restaurantId, restaurantName, restaurantDeliveryFee);
      }
      return newItems;
    });
  }, [restaurantId, restaurantName, restaurantDeliveryFee, persist]);

  const removeItem = useCallback((foodId, customization = null) => {
    updateQuantity(foodId, 0, customization);
  }, [updateQuantity]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName('');
    setRestaurantDeliveryFee(0);
    localStorage.removeItem(CART_KEY);
  }, []);

  const toggleFavorite = useCallback((foodId) => {
    setFavorites(prev => {
      const newFavs = prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const isFavorite = useCallback((foodId) => favorites.includes(foodId), [favorites]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items,
    restaurantId,
    restaurantName,
    restaurantDeliveryFee,
    subtotal,
    totalItems,
    favorites,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    toggleFavorite,
    isFavorite,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

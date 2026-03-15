import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Table, 
  Badge, 
  Spinner, 
  Button, 
  Modal, 
  Form, 
  Row, 
  Col,
  Card
} from 'react-bootstrap';
import { FiPlus, FiEdit, FiDollarSign, FiDroplet } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

interface MilkPrice {
  id: string;
  price_date: string;
  base_price: number;
  base_fat: number;
  base_snf: number;
  fat_rate: number;
  snf_rate: number;
  bonus: number;
  milk_type: string;
  is_active: boolean;
  notes?: string;
}

interface DairyCenter {
  id: string;
  dairy_name: string;
  contact_mobile: string;
  is_active: boolean;
  base_price_cow?: number;
  base_price_buffalo?: number;
}

interface CollectionFormData {
  center_id: string;
  collection_date: string;
  collection_time: 'morning' | 'evening';
  cow: {
    milk_weight: string;
    fat_percentage: string;
    snf_percentage: string;
    base_price: string;
    net_price?: string;
  };
  buffalo: {
    milk_weight: string;
    fat_percentage: string;
    snf_percentage: string;
    base_price: string;
    net_price?: string;
  };
}

interface CenterCollectionData {
  center_id: string;
  center_name: string;
  cow: {
    base_price: string;
    fat_percentage: string;
    snf_percentage: string;
    net_price: string;
    weight: string;
    total_price: string;
  };
  buffalo: {
    base_price: string;
    fat_percentage: string;
    snf_percentage: string;
    net_price: string;
    weight: string;
    total_price: string;
  };
}

const MilkPrice = () => {
  const [prices, setPrices] = useState<MilkPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<MilkPrice | null>(null);
  const [formData, setFormData] = useState({
    price_date: new Date().toISOString().split('T')[0],
    base_price: '',
    base_fat: '',
    base_snf: '',
    fat_rate: '5.0',
    snf_rate: '5.0',
    bonus: '1.0',
    milk_type: 'cow',
    notes: '',
  });
  const [previewData, setPreviewData] = useState({
    fat_percentage: '4.0',
    snf_percentage: '8.5',
    calculated_rate: 0,
  });

  // Milk Collection States
  const [centers, setCenters] = useState<DairyCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<DairyCenter | null>(null);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [centerPriceForm, setCenterPriceForm] = useState({
    center_id: '',
    base_price_cow: '',
    base_price_buffalo: '',
    price_date: new Date().toISOString().split('T')[0],
  });
  const [collectionForm, setCollectionForm] = useState<CollectionFormData>({
    center_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    collection_time: 'morning',
    cow: {
      milk_weight: '',
      fat_percentage: '',
      snf_percentage: '',
      base_price: '',
    },
    buffalo: {
      milk_weight: '',
      fat_percentage: '',
      snf_percentage: '',
      base_price: '',
    },
  });

  // New state for collection page
  const [globalBasePriceCow, setGlobalBasePriceCow] = useState<string>('30');
  const [globalBasePriceBuffalo, setGlobalBasePriceBuffalo] = useState<string>('45');
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [collectionTime, setCollectionTime] = useState<'morning' | 'evening'>('morning');
  const [centerCollections, setCenterCollections] = useState<CenterCollectionData[]>([]);
  const [priceConfig, setPriceConfig] = useState<any>(null);

  useEffect(() => {
    fetchPrices();
    fetchCenters();
    fetchPriceConfig();
  }, []);

  useEffect(() => {
    if (collectionDate && centers.length > 0) {
      fetchPriceConfig();
      initializeCenterCollections();
    }
  }, [collectionDate, centers.length]);

  // Initialize centers when date changes (no data loading - only for adding new collections)
  useEffect(() => {
    if (collectionDate && centers.length > 0) {
      initializeCenterCollections();
    }
  }, [collectionDate, centers.length]);

  // Fetch price configuration for the selected date
  const fetchPriceConfig = async () => {
    try {
      const [cowResponse, buffaloResponse] = await Promise.all([
        axios.get('/milk-price/single', { params: { date: collectionDate, milk_type: 'cow' } }).catch(() => ({ data: { data: null } })),
        axios.get('/milk-price/single', { params: { date: collectionDate, milk_type: 'buffalo' } }).catch(() => ({ data: { data: null } })),
      ]);
      
      const cowPrice = cowResponse.data.data;
      const buffaloPrice = buffaloResponse.data.data;
      
      if (cowPrice) {
        setGlobalBasePriceCow(cowPrice.base_price?.toString() || '');
      }
      if (buffaloPrice) {
        setGlobalBasePriceBuffalo(buffaloPrice.base_price?.toString() || '');
      }
      
      setPriceConfig({ cow: cowPrice, buffalo: buffaloPrice });
    } catch (error) {
      console.error('Failed to fetch price config:', error);
    }
  };

  // Initialize center collections data
  const initializeCenterCollections = async () => {
    if (centers.length === 0) return;
    
    const today = collectionDate;
    const collections: CenterCollectionData[] = await Promise.all(
      centers.map(async (center) => {
        const cowPrice = await getBasePrice(center.id, 'cow', today);
        const buffaloPrice = await getBasePrice(center.id, 'buffalo', today);
        
        return {
          center_id: center.id,
          center_name: center.dairy_name,
          cow: {
            base_price: cowPrice?.toString() || globalBasePriceCow || '30',
            fat_percentage: '',
            snf_percentage: '',
            net_price: '',
            weight: '',
            total_price: '',
          },
          buffalo: {
            base_price: buffaloPrice?.toString() || globalBasePriceBuffalo || '45',
            fat_percentage: '',
            snf_percentage: '',
            net_price: '',
            weight: '',
            total_price: '',
          },
        };
      })
    );
    
    setCenterCollections(collections);
  };

  // Calculate net price based on FAT and SNF using rate chart logic
  const calculateNetPrice = (basePrice: number, fat: number, snf: number, milkType: 'cow' | 'buffalo') => {
    if (!basePrice || !fat || !snf) return 0;
    
    // If price config is available, use it for calculation
    if (priceConfig) {
      const config = priceConfig[milkType];
      if (config) {
        const fatDiff = fat - (config.base_fat || 0);
        const snfDiff = snf - (config.base_snf || 0);
        const calculatedRate = basePrice + (fatDiff * config.fat_rate) + (snfDiff * config.snf_rate) + (config.bonus || 0);
        return Math.max(0, calculatedRate); // Ensure non-negative
      }
    }
    
    // Fallback: If no config, return base price (will be updated when config loads)
    return basePrice;
  };

  // Calculate total price: price × weight (e.g., 29.50 × 1.5 = 44.25)
  const calculateTotalPrice = (price: number, weight: number) => {
    if (!price || !weight) return 0;
    return price * weight;
  };

  // Handle center collection data change
  const handleCenterCollectionChange = (
    centerIndex: number,
    milkType: 'cow' | 'buffalo',
    field: string,
    value: string
  ) => {
    // Prevent negative values for all numeric fields
    const numValue = parseFloat(value);
    if (value !== '' && !isNaN(numValue) && numValue < 0) {
      return; // Don't update if negative
    }
    
    setCenterCollections(prev => {
      const updated = [...prev];
      const center = updated[centerIndex];
      
      if (milkType === 'cow') {
        center.cow = { ...center.cow, [field]: value };
        
        // Recalculate total if price or weight changed
        if (field === 'net_price' || field === 'weight') {
          const price = Math.max(0, parseFloat(center.cow.net_price) || 0);
          const weight = Math.max(0, parseFloat(center.cow.weight) || 0);
          const totalPrice = calculateTotalPrice(price, weight);
          center.cow.total_price = totalPrice.toFixed(2);
        }
      } else {
        center.buffalo = { ...center.buffalo, [field]: value };
        
        // Recalculate total if price or weight changed
        if (field === 'net_price' || field === 'weight') {
          const price = Math.max(0, parseFloat(center.buffalo.net_price) || 0);
          const weight = Math.max(0, parseFloat(center.buffalo.weight) || 0);
          const totalPrice = calculateTotalPrice(price, weight);
          center.buffalo.total_price = totalPrice.toFixed(2);
        }
      }
      
      return updated;
    });
  };

  // Fetch existing collections for selected date and time
  const fetchExistingCollections = async () => {
    if (!collectionDate || !collectionTime || centers.length === 0) {
      console.log('Cannot fetch: missing date, time, or centers', { collectionDate, collectionTime, centersLength: centers.length });
      return;
    }
    
    // If centerCollections is empty, initialize it first
    if (centerCollections.length === 0) {
      await initializeCenterCollections();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      const response = await axios.get('/milk/collections', {
        params: {
          collection_date: collectionDate,
          collection_time: collectionTime,
          limit: 1000,
        },
      });
      
      const existingCollections = response.data.data || [];
      
      // Update centerCollections with existing data
      setCenterCollections(prev => {
        if (prev.length === 0) {
          // If still empty, return empty array
          return prev;
        }
        
        return prev.map(center => {
          // Find cow collection for this center (check both vendor_id and center_id for compatibility)
          const cowCollection = existingCollections.find(
            (c: any) => (c.vendor_id === center.center_id || c.center_id === center.center_id) && c.milk_type === 'cow'
          );
          
          // Find buffalo collection for this center (check both vendor_id and center_id for compatibility)
          const buffaloCollection = existingCollections.find(
            (c: any) => (c.vendor_id === center.center_id || c.center_id === center.center_id) && c.milk_type === 'buffalo'
          );
          
          return {
            ...center,
            cow: {
              ...center.cow,
              ...(cowCollection && {
                fat_percentage: cowCollection.fat_percentage?.toString() || '',
                snf_percentage: cowCollection.snf_percentage?.toString() || '',
                net_price: cowCollection.rate_per_liter?.toString() || cowCollection.base_value?.toString() || '',
                weight: cowCollection.milk_weight?.toString() || '',
                total_price: cowCollection.total_amount?.toString() || '',
              }),
            },
            buffalo: {
              ...center.buffalo,
              ...(buffaloCollection && {
                fat_percentage: buffaloCollection.fat_percentage?.toString() || '',
                snf_percentage: buffaloCollection.snf_percentage?.toString() || '',
                net_price: buffaloCollection.rate_per_liter?.toString() || buffaloCollection.base_value?.toString() || '',
                weight: buffaloCollection.milk_weight?.toString() || '',
                total_price: buffaloCollection.total_amount?.toString() || '',
              }),
            },
          };
        });
      });
    } catch (error) {
      console.error('Failed to fetch existing collections:', error);
      // Don't show error, just continue with empty form
    }
  };

  // Save all collections
  const handleSaveAllCollections = async () => {
    try {
      // Validate date - cannot add collections for future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(collectionDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        toast.error('Cannot add collections for future dates. Please select today or a past date.');
        return;
      }
      
      const updates = [];
      let totalWeight = 0;
      let totalAmount = 0;
      
      for (const centerCollection of centerCollections) {
        // Save cow milk collection if weight and price provided (FAT and SNF are optional)
        // Skip if dairy center didn't provide milk (empty weight or price)
        if (centerCollection.cow.weight && centerCollection.cow.net_price) {
          const weight = parseFloat(centerCollection.cow.weight);
          const price = parseFloat(centerCollection.cow.net_price);
          const total = parseFloat(centerCollection.cow.total_price) || (weight * price);
          
          totalWeight += weight;
          totalAmount += total;
          
          const cowData = {
            center_id: centerCollection.center_id,
            collection_date: collectionDate,
            collection_time: collectionTime,
            milk_type: 'cow',
            milk_weight: weight,
            rate_per_liter: price, // Use the entered price directly - no calculation needed
            fat_percentage: centerCollection.cow.fat_percentage ? parseFloat(centerCollection.cow.fat_percentage) : undefined, // Optional
            snf_percentage: centerCollection.cow.snf_percentage ? parseFloat(centerCollection.cow.snf_percentage) : undefined, // Optional
          };
          // Handle errors properly
          updates.push(
            axios.post('/milk/collections', cowData)
              .then((response: any) => {
                return response;
              })
              .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '';
                // Don't silently ignore duplicate errors - show them to user
                if (errorMessage.includes('already exists')) {
                  throw new Error(errorMessage);
                }
                // Silently ignore "Milk price not set" errors (using defaults)
                if (errorMessage.includes('Milk price not set for today')) {
                  return Promise.resolve({ data: { success: true } });
                }
                // Re-throw other errors
                throw error;
              })
          );
        }
        
        // Save buffalo milk collection if weight and price provided (FAT and SNF are optional)
        // Skip if dairy center didn't provide milk (empty weight or price)
        if (centerCollection.buffalo.weight && centerCollection.buffalo.net_price) {
          const weight = parseFloat(centerCollection.buffalo.weight);
          const price = parseFloat(centerCollection.buffalo.net_price);
          const total = parseFloat(centerCollection.buffalo.total_price) || (weight * price);
          
          totalWeight += weight;
          totalAmount += total;
          
          const buffaloData = {
            center_id: centerCollection.center_id,
            collection_date: collectionDate,
            collection_time: collectionTime,
            milk_type: 'buffalo',
            milk_weight: weight,
            rate_per_liter: price, // Use the entered price directly - no calculation needed
            fat_percentage: centerCollection.buffalo.fat_percentage ? parseFloat(centerCollection.buffalo.fat_percentage) : undefined, // Optional
            snf_percentage: centerCollection.buffalo.snf_percentage ? parseFloat(centerCollection.buffalo.snf_percentage) : undefined, // Optional
          };
          // Handle errors properly
          updates.push(
            axios.post('/milk/collections', buffaloData)
              .then((response: any) => {
                return response;
              })
              .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '';
                // Don't silently ignore duplicate errors - show them to user
                if (errorMessage.includes('already exists')) {
                  throw new Error(errorMessage);
                }
                // Silently ignore "Milk price not set" errors (using defaults)
                if (errorMessage.includes('Milk price not set for today')) {
                  return Promise.resolve({ data: { success: true } });
                }
                // Re-throw other errors
                throw error;
              })
          );
        }
      }
      
      if (updates.length === 0) {
        toast.error('Please provide at least one collection with weight and price');
        return;
      }
      
      await Promise.all(updates);
      
      // Store total weight and total amount (you may need to create a separate endpoint for this)
      // For now, we'll log it - you can add an API call to store these totals
      console.log('Total Weight:', totalWeight, 'Total Amount:', totalAmount);
      
      toast.success(`Milk collections saved successfully! Total Weight: ${totalWeight.toFixed(2)} kg, Total Amount: ₹${totalAmount.toFixed(2)}`);
      
      // Reset form to empty state for next entry (no data loading - only for adding)
      await initializeCenterCollections();
      
      // Dispatch event to refresh Milk Collections page
      window.dispatchEvent(new Event('collections-updated'));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Failed to add collections';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
        console.error('Collection error:', error.response?.data);
      }
      // Silently ignore the "Milk price not set" error
    }
  };

  useEffect(() => {
    if (!showModal) {
      resetForm();
    }
  }, [showModal]);

  const fetchPrices = async () => {
    try {
      // Commented out: http://localhost:3001/api/milk-price
      // const response = await axios.get('/milk-price');
      // setPrices(response.data.data);
      setPrices([]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch prices';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Commented out: http://localhost:3001/api/milk-price
      // await axios.post('/milk-price', {
      //   ...formData,
      //   base_price: parseFloat(formData.base_price),
      //   base_fat: parseFloat(formData.base_fat),
      //   base_snf: parseFloat(formData.base_snf),
      //   fat_rate: parseFloat(formData.fat_rate),
      //   snf_rate: parseFloat(formData.snf_rate),
      //   bonus: parseFloat(formData.bonus),
      // });
      // toast.success('Milk price set successfully!');
      // setShowModal(false);
      // resetForm();
      // fetchPrices();
      toast.info('Milk price endpoint is disabled');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to set price';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
      }
    }
  };

  const handlePreview = async () => {
    try {
      const response = await axios.get('/milk-price/preview', {
        params: {
          milk_type: formData.milk_type,
          fat_percentage: previewData.fat_percentage,
          snf_percentage: previewData.snf_percentage,
          date: formData.price_date,
        },
      });
      setPreviewData({
        ...previewData,
        calculated_rate: response.data.data.rate,
      });
      setShowPreviewModal(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to calculate preview';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      price_date: new Date().toISOString().split('T')[0],
      base_price: '',
      base_fat: '',
      base_snf: '',
      fat_rate: '5.0',
      snf_rate: '5.0',
      bonus: '1.0',
      milk_type: 'cow',
      notes: '',
    });
  };

  // Get base price for a center and milk type
  const getBasePrice = async (centerId: string, milkType: 'cow' | 'buffalo', date: string) => {
    try {
      const response = await axios.get('/milk/center-price', {
        params: {
          center_id: centerId,
          milk_type: milkType,
          price_date: date,
        },
      });
      return response.data.data?.base_price || null;
    } catch (error: any) {
      // Silently ignore "Milk price not set" errors
      const errorMessage = error.response?.data?.message || '';
      if (errorMessage.includes('Milk price not set for today')) {
        return null;
      }
      // If no center-specific price, get default from milk price
      try {
        const priceResponse = await axios.get('/milk-price/single', {
          params: {
            date: date,
            milk_type: milkType,
          },
        });
        return priceResponse.data.data?.base_price || null;
      } catch (err: any) {
        // Silently ignore "Milk price not set" errors here too
        const errMessage = err.response?.data?.message || '';
        if (errMessage.includes('Milk price not set for today')) {
          return null;
        }
        return null;
      }
    }
  };

  // Fetch active dairy centers with base prices
  const fetchCenters = async () => {
    try {
      setLoadingCenters(true);
      const response = await axios.get('/centers');
      const allCenters = response.data.data || [];
      // Filter only active centers
      const activeCenters = allCenters.filter((center: DairyCenter) => center.is_active);
      
      // Fetch base prices for each center
      const today = new Date().toISOString().split('T')[0];
      const centersWithPrices = await Promise.all(
        activeCenters.map(async (center: DairyCenter) => {
          try {
            const cowPrice = await getBasePrice(center.id, 'cow', today);
            const buffaloPrice = await getBasePrice(center.id, 'buffalo', today);
            return {
              ...center,
              base_price_cow: cowPrice,
              base_price_buffalo: buffaloPrice,
            };
          } catch (error) {
            return {
              ...center,
              base_price_cow: undefined,
              base_price_buffalo: undefined,
            };
          }
        })
      );
      
      setCenters(centersWithPrices);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch centers';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
      }
    } finally {
      setLoadingCenters(false);
    }
  };

  // Handle edit center base price
  const handleEditCenterPrice = async (center: DairyCenter) => {
    setEditingCenter(center);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch current prices
    const cowPrice = await getBasePrice(center.id, 'cow', today);
    const buffaloPrice = await getBasePrice(center.id, 'buffalo', today);
    
    setCenterPriceForm({
      center_id: center.id,
      base_price_cow: cowPrice?.toString() || '',
      base_price_buffalo: buffaloPrice?.toString() || '',
      price_date: today,
    });
    setShowEditPriceModal(true);
  };

  // Save center base price
  const handleSaveCenterPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (centerPriceForm.base_price_cow) {
        await axios.post('/milk/center-price', {
          center_id: centerPriceForm.center_id,
          price_date: centerPriceForm.price_date,
          milk_type: 'cow',
          base_price: parseFloat(centerPriceForm.base_price_cow),
        });
      }
      if (centerPriceForm.base_price_buffalo) {
        await axios.post('/milk/center-price', {
          center_id: centerPriceForm.center_id,
          price_date: centerPriceForm.price_date,
          milk_type: 'buffalo',
          base_price: parseFloat(centerPriceForm.base_price_buffalo),
        });
      }
      toast.success('Center base prices updated successfully!');
      setShowEditPriceModal(false);
      fetchCenters();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update center prices';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
      }
    }
  };

  // Handle add collection
  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates = [];

      // Create cow milk collection if data provided
      if (collectionForm.cow.milk_weight && collectionForm.cow.fat_percentage && collectionForm.cow.snf_percentage) {
        // Get price config for calculation
        try {
          const priceResponse = await axios.get('/milk-price/single', {
            params: {
              date: collectionForm.collection_date,
              milk_type: 'cow',
            },
          });
          const priceConfig = priceResponse.data.data;
          if (priceConfig) {
            const basePrice = parseFloat(collectionForm.cow.base_price) || priceConfig.base_price;
            const fatDiff = parseFloat(collectionForm.cow.fat_percentage) - (priceConfig.base_fat || 0);
            const snfDiff = parseFloat(collectionForm.cow.snf_percentage) - (priceConfig.base_snf || 0);
            const calculatedRate = basePrice + (fatDiff * priceConfig.fat_rate) + (snfDiff * priceConfig.snf_rate) + (priceConfig.bonus || 0);
            const finalRate = collectionForm.cow.net_price ? parseFloat(collectionForm.cow.net_price) : calculatedRate;
            const totalAmount = (parseFloat(collectionForm.cow.milk_weight) * finalRate) / 100;

            updates.push(
              axios.post('/milk/collections', {
                vendor_id: collectionForm.center_id,
                collection_date: collectionForm.collection_date,
                collection_time: collectionForm.collection_time,
                milk_type: 'cow',
                milk_weight: parseFloat(collectionForm.cow.milk_weight),
                fat_percentage: parseFloat(collectionForm.cow.fat_percentage),
                snf_percentage: parseFloat(collectionForm.cow.snf_percentage),
                rate_per_liter: finalRate,
                base_value: basePrice,
                net_price: collectionForm.cow.net_price ? parseFloat(collectionForm.cow.net_price) : null,
                total_amount: Math.round(totalAmount * 100) / 100,
              })
            );
          }
        } catch (error) {
          // Fallback if price config not found
          const basePrice = parseFloat(collectionForm.cow.base_price) || 0;
          const finalRate = collectionForm.cow.net_price ? parseFloat(collectionForm.cow.net_price) : basePrice;
          const totalAmount = (parseFloat(collectionForm.cow.milk_weight) * finalRate) / 100;

          updates.push(
            axios.post('/milk/collections', {
              vendor_id: collectionForm.center_id,
              collection_date: collectionForm.collection_date,
              collection_time: collectionForm.collection_time,
              milk_type: 'cow',
              milk_weight: parseFloat(collectionForm.cow.milk_weight),
              fat_percentage: parseFloat(collectionForm.cow.fat_percentage),
              snf_percentage: parseFloat(collectionForm.cow.snf_percentage),
              rate_per_liter: finalRate,
              base_value: basePrice,
              net_price: collectionForm.cow.net_price ? parseFloat(collectionForm.cow.net_price) : null,
              total_amount: Math.round(totalAmount * 100) / 100,
            })
          );
        }
      }

      // Create buffalo milk collection if data provided
      if (collectionForm.buffalo.milk_weight && collectionForm.buffalo.fat_percentage && collectionForm.buffalo.snf_percentage) {
        try {
          const priceResponse = await axios.get('/milk-price/single', {
            params: {
              date: collectionForm.collection_date,
              milk_type: 'buffalo',
            },
          });
          const priceConfig = priceResponse.data.data;
          if (priceConfig) {
            const basePrice = parseFloat(collectionForm.buffalo.base_price) || priceConfig.base_price;
            const fatDiff = parseFloat(collectionForm.buffalo.fat_percentage) - (priceConfig.base_fat || 0);
            const snfDiff = parseFloat(collectionForm.buffalo.snf_percentage) - (priceConfig.base_snf || 0);
            const calculatedRate = basePrice + (fatDiff * priceConfig.fat_rate) + (snfDiff * priceConfig.snf_rate) + (priceConfig.bonus || 0);
            const finalRate = collectionForm.buffalo.net_price ? parseFloat(collectionForm.buffalo.net_price) : calculatedRate;
            const totalAmount = (parseFloat(collectionForm.buffalo.milk_weight) * finalRate) / 100;

            updates.push(
              axios.post('/milk/collections', {
                vendor_id: collectionForm.center_id,
                collection_date: collectionForm.collection_date,
                collection_time: collectionForm.collection_time,
                milk_type: 'buffalo',
                milk_weight: parseFloat(collectionForm.buffalo.milk_weight),
                fat_percentage: parseFloat(collectionForm.buffalo.fat_percentage),
                snf_percentage: parseFloat(collectionForm.buffalo.snf_percentage),
                rate_per_liter: finalRate,
                base_value: basePrice,
                net_price: collectionForm.buffalo.net_price ? parseFloat(collectionForm.buffalo.net_price) : null,
                total_amount: Math.round(totalAmount * 100) / 100,
              })
            );
          }
        } catch (error) {
          const basePrice = parseFloat(collectionForm.buffalo.base_price) || 0;
          const finalRate = collectionForm.buffalo.net_price ? parseFloat(collectionForm.buffalo.net_price) : basePrice;
          const totalAmount = (parseFloat(collectionForm.buffalo.milk_weight) * finalRate) / 100;

          updates.push(
            axios.post('/milk/collections', {
              vendor_id: collectionForm.center_id,
              collection_date: collectionForm.collection_date,
              collection_time: collectionForm.collection_time,
              milk_type: 'buffalo',
              milk_weight: parseFloat(collectionForm.buffalo.milk_weight),
              fat_percentage: parseFloat(collectionForm.buffalo.fat_percentage),
              snf_percentage: parseFloat(collectionForm.buffalo.snf_percentage),
              rate_per_liter: finalRate,
              base_value: basePrice,
              net_price: collectionForm.buffalo.net_price ? parseFloat(collectionForm.buffalo.net_price) : null,
              total_amount: Math.round(totalAmount * 100) / 100,
            })
          );
        }
      }

      if (updates.length === 0) {
        toast.error('Please provide at least one milk type data');
        return;
      }

      await Promise.all(updates);
      toast.success('Milk collection added successfully!');
      setShowCollectionModal(false);
      resetCollectionForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add collection';
      // Filter out the "Milk price not set" error message
      if (errorMessage && !errorMessage.includes('Milk price not set for today')) {
        toast.error(errorMessage);
      }
    }
  };

  const resetCollectionForm = () => {
    setCollectionForm({
      center_id: '',
      collection_date: new Date().toISOString().split('T')[0],
      collection_time: 'morning',
      cow: {
        milk_weight: '',
        fat_percentage: '',
        snf_percentage: '',
        base_price: '',
      },
      buffalo: {
        milk_weight: '',
        fat_percentage: '',
        snf_percentage: '',
        base_price: '',
      },
    });
  };

  // Load base prices when center or date changes
  useEffect(() => {
    if (collectionForm.center_id && collectionForm.collection_date) {
      const loadBasePrices = async () => {
        const cowPrice = await getBasePrice(collectionForm.center_id, 'cow', collectionForm.collection_date);
        const buffaloPrice = await getBasePrice(collectionForm.center_id, 'buffalo', collectionForm.collection_date);
        
        setCollectionForm(prev => ({
          ...prev,
          cow: { ...prev.cow, base_price: cowPrice?.toString() || '' },
          buffalo: { ...prev.buffalo, base_price: buffaloPrice?.toString() || '' },
        }));
      };
      loadBasePrices();
    }
  }, [collectionForm.center_id, collectionForm.collection_date]);

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#6F42C1' }}>Add Collection</h2>
        {/* <Button variant="primary" onClick={() => setShowModal(true)}>
          <FiPlus className="me-2" />
          Set Daily Price
        </Button> */}
      </div>

      {/* Commented out - Daily Price Table */}
      {/* <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Milk Type</th>
            <th>Base Price</th>
            <th>Base FAT</th>
            <th>Base SNF</th>
            <th>FAT Rate</th>
            <th>SNF Rate</th>
            <th>Bonus</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.id}>
              <td>{format(new Date(price.price_date), 'dd/MM/yyyy')}</td>
              <td>
                <Badge bg="info">{price.milk_type}</Badge>
              </td>
              <td>₹{(Number(price.base_price) || 0).toFixed(2)}</td>
              <td>{price.base_fat}%</td>
              <td>{price.base_snf}%</td>
              <td>₹{Number(price.fat_rate) || 0}/%</td>
              <td>₹{Number(price.snf_rate) || 0}/%</td>
              <td>₹{(Number(price.bonus) || 0).toFixed(2)}</td>
              <td>
                <Badge bg={price.is_active ? 'success' : 'secondary'}>
                  {price.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table> */}

      {/* Base Price and Date/Time Selection */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header 
          className="text-white border-0"
          style={{ 
            backgroundColor: '#6F42C1',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <h5 className="mb-0 fw-semibold">Base Price & Collection Details</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {/* <Col md={3}>
              <Form.Group>
                <Form.Label>Base Price - Cow (₹)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={globalBasePriceCow}
                  onChange={(e) => {
                    setGlobalBasePriceCow(e.target.value);
                    // Update all center cow base prices
                    setCenterCollections(prev => prev.map(center => ({
                      ...center,
                      cow: { ...center.cow, base_price: e.target.value }
                    })));
                  }}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Base Price - Buffalo (₹)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={globalBasePriceBuffalo}
                  onChange={(e) => {
                    setGlobalBasePriceBuffalo(e.target.value);
                    // Update all center buffalo base prices
                    setCenterCollections(prev => prev.map(center => ({
                      ...center,
                      buffalo: { ...center.buffalo, base_price: e.target.value }
                    })));
                  }}
                />
              </Form.Group>
            </Col> */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Collection Date</Form.Label>
                <Form.Control
                  type="date"
                  value={collectionDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    
                    if (selectedDate > today) {
                      toast.error('Cannot select future dates. Please select today or a past date.');
                      return;
                    }
                    
                    setCollectionDate(selectedDate);
                  }}
                  onClick={(e) => {
                    // Ensure calendar opens on click
                    (e.target as HTMLInputElement).showPicker?.();
                  }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Collection Time</Form.Label>
                <Form.Select
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value as 'morning' | 'evening')}
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Milk Collections - Cow and Buffalo One After Another */}
      <Card className="mb-4">
        <Card.Header 
          className="text-white border-0"
          style={{ 
            backgroundColor: '#6F42C1',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <h5 className="mb-0">Milk Collections</h5>
        </Card.Header>
        <Card.Body>
          {loadingCenters ? (
            <Spinner animation="border" />
          ) : centerCollections.length === 0 ? (
            <p className="text-muted">No active dairy centers found</p>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Center Name</th>
                    <th>Milk Type</th>
                    {/* <th>Base Price (₹)</th> */}
                    <th>FAT</th>
                    <th>SNF</th>
                    <th>Price (₹)</th>
                    <th>Weight (kg)</th>
                    <th>Total Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {centerCollections.map((center, index) => (
                    <React.Fragment key={center.center_id}>
                      {/* Cow Milk Row */}
                      <tr>
                        <td rowSpan={2} className="fw-semibold align-middle">{center.center_name}</td>
                        <td className="fw-bold">Cow</td>
                        {/* <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            size="sm"
                            value={center.cow.base_price}
                            onChange={(e) => handleCenterCollectionChange(index, 'cow', 'base_price', e.target.value)}
                          />
                        </td> */}
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0"
                            size="sm"
                            value={center.cow.fat_percentage}
                            onChange={(e) => handleCenterCollectionChange(index, 'cow', 'fat_percentage', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0"
                            size="sm"
                            value={center.cow.snf_percentage}
                            onChange={(e) => handleCenterCollectionChange(index, 'cow', 'snf_percentage', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            size="sm"
                            value={center.cow.net_price || ''}
                            onChange={(e) => handleCenterCollectionChange(index, 'cow', 'net_price', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            size="sm"
                            value={center.cow.weight}
                            onChange={(e) => handleCenterCollectionChange(index, 'cow', 'weight', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            size="sm"
                            value={center.cow.total_price}
                            readOnly
                            className="bg-light fw-bold"
                          />
                        </td>
                      </tr>
                      {/* Buffalo Milk Row */}
                      <tr>
                        <td className="fw-bold">Buffalo</td>
                        {/* <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            size="sm"
                            value={center.buffalo.base_price}
                            onChange={(e) => handleCenterCollectionChange(index, 'buffalo', 'base_price', e.target.value)}
                          />
                        </td> */}
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0"
                            size="sm"
                            value={center.buffalo.fat_percentage}
                            onChange={(e) => handleCenterCollectionChange(index, 'buffalo', 'fat_percentage', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0"
                            size="sm"
                            value={center.buffalo.snf_percentage}
                            onChange={(e) => handleCenterCollectionChange(index, 'buffalo', 'snf_percentage', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            size="sm"
                            value={center.buffalo.net_price || ''}
                            onChange={(e) => handleCenterCollectionChange(index, 'buffalo', 'net_price', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            size="sm"
                            value={center.buffalo.weight}
                            onChange={(e) => handleCenterCollectionChange(index, 'buffalo', 'weight', e.target.value)}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            size="sm"
                            value={center.buffalo.total_price}
                            readOnly
                            className="bg-light fw-bold"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Collection Button */}
      <div className="d-flex justify-content-end mb-4">
        <Button 
          variant="success" 
          size="lg" 
          onClick={handleSaveAllCollections}
          className="fw-semibold"
          style={{
            backgroundColor: '#00CCCC',
            borderColor: '#00CCCC',
            color: 'white',
            borderRadius: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00b3b3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00CCCC';
          }}
        >
          <FiPlus className="me-2" />
          Add Collection
        </Button>
      </div>

      {/* Create/Edit Price Modal - Commented out */}
      {/* <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Set Daily Milk Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.price_date}
                    onChange={(e) => setFormData({ ...formData, price_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Milk Type *</Form.Label>
                  <Form.Select
                    value={formData.milk_type}
                    onChange={(e) => setFormData({ ...formData, milk_type: e.target.value })}
                    required
                  >
                    <option value="cow">Cow</option>
                    <option value="buffalo">Buffalo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Base Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="36.00 for cow, 51.00 for buffalo"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Base FAT (%) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.base_fat}
                    onChange={(e) => setFormData({ ...formData, base_fat: e.target.value })}
                    placeholder="3.5 for cow, 6.0 for buffalo"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Base SNF (%) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.base_snf}
                    onChange={(e) => setFormData({ ...formData, base_snf: e.target.value })}
                    placeholder="8.5 for cow, 9.0 for buffalo"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>FAT Rate (₹ per 1%) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.fat_rate}
                    onChange={(e) => setFormData({ ...formData, fat_rate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>SNF Rate (₹ per 1%) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.snf_rate}
                    onChange={(e) => setFormData({ ...formData, snf_rate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bonus (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Preview: FAT %</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={previewData.fat_percentage}
                    onChange={(e) => setPreviewData({ ...previewData, fat_percentage: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Preview: SNF %</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={previewData.snf_percentage}
                    onChange={(e) => setPreviewData({ ...previewData, snf_percentage: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="outline-info" onClick={handlePreview} className="mb-3">
              Calculate Preview
            </Button>
            {previewData.calculated_rate > 0 && (
              <div className="alert alert-info">
                Calculated Rate: ₹{(Number(previewData.calculated_rate) || 0).toFixed(2)}/liter
              </div>
            )}
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2 fw-semibold" 
                onClick={() => { setShowModal(false); resetForm(); }}
                style={{
                  backgroundColor: '#17A2B8',
                  borderColor: '#17A2B8',
                  color: 'white',
                  borderRadius: '8px'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                className="fw-semibold"
                style={{
                  backgroundColor: '#6F42C1',
                  borderColor: '#6F42C1',
                  borderRadius: '8px'
                }}
              >
                Set Price
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal> */}

      {/* Milk Collection Management Section - Commented out */}
      {/* <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3><FiDroplet className="me-2" />Milk Collection Management</h3>
          <Button variant="success" onClick={() => setShowCollectionModal(true)}>
            <FiPlus className="me-2" />
            Add Collection
          </Button>
        </div>

        <Card className="mb-4">
          <Card.Header 
          className="text-white border-0"
          style={{ 
            backgroundColor: '#6F42C1',
            borderRadius: '8px 8px 0 0'
          }}
        >
            <h5 className="mb-0">Active Dairy Centers & Base Prices</h5>
          </Card.Header>
          <Card.Body>
            {loadingCenters ? (
              <Spinner animation="border" />
            ) : centers.length === 0 ? (
              <p className="text-muted">No active dairy centers found</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Center Name</th>
                    <th>Contact</th>
                    <th>Base Price (Cow)</th>
                    <th>Base Price (Buffalo)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.map((center) => (
                    <tr key={center.id}>
                      <td className="fw-semibold">{center.dairy_name}</td>
                      <td>{center.contact_mobile}</td>
                      <td>
                        ₹{center.base_price_cow ? Number(center.base_price_cow).toFixed(2) : 'N/A'}
                      </td>
                      <td>
                        ₹{center.base_price_buffalo ? Number(center.base_price_buffalo).toFixed(2) : 'N/A'}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditCenterPrice(center)}
                        >
                          <FiEdit className="me-1" />
                          Edit Price
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </div> */}

      {/* Old Modals - Commented out */}
      {/* <Modal show={showEditPriceModal} onHide={() => setShowEditPriceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Base Price - {editingCenter?.dairy_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveCenterPrice}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={centerPriceForm.price_date}
                    onChange={(e) => setCenterPriceForm({ ...centerPriceForm, price_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Base Price - Cow Milk (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={centerPriceForm.base_price_cow}
                    onChange={(e) => setCenterPriceForm({ ...centerPriceForm, base_price_cow: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Base Price - Buffalo Milk (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={centerPriceForm.base_price_buffalo}
                    onChange={(e) => setCenterPriceForm({ ...centerPriceForm, base_price_buffalo: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2 fw-semibold" 
                onClick={() => setShowEditPriceModal(false)}
                style={{
                  backgroundColor: '#17A2B8',
                  borderColor: '#17A2B8',
                  color: 'white',
                  borderRadius: '8px'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                className="fw-semibold"
                style={{
                  backgroundColor: '#6F42C1',
                  borderColor: '#6F42C1',
                  borderRadius: '8px'
                }}
              >
                Save Prices
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal> */}

      {/* Old Add Collection Modal - Commented out (removed to avoid JSX parsing issues) */}
    </div>
  );
};

export default MilkPrice;


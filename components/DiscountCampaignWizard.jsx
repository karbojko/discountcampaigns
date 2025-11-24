import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscountCampaigns } from '../src/context/DiscountCampaignContext';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Tabs,
  Tab,
  Checkbox,
  Divider,
  Paper,
  Radio,
  RadioGroup,
  FormLabel,
  FormHelperText,
  OutlinedInput,
  Chip,
  Autocomplete,
  Tooltip,
  Grid,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import CardMembershipRounded from '@mui/icons-material/CardMembershipRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import ExtensionRounded from '@mui/icons-material/ExtensionRounded';
import TranslateRounded from '@mui/icons-material/TranslateRounded';
import CollapsibleBlock from './CollapsibleBlock';
import {
  buildMembershipDiscountSummary,
  buildFlatFeeDiscountSummary,
  buildModuleDiscountSummary,
} from './utils/discountSummary';

// Simple i18n helper - marks fields as translatable
const t = (key, defaultValue) => {
  // In a real app, this would look up translations
  // For now, return the default value
  return defaultValue || key;
};

export default function DiscountCampaignWizard({ open, onCancel, onComplete }) {
  const navigate = useNavigate();
  const { addCampaign } = useDiscountCampaigns();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);

  // Basic Information
  const [internalName, setInternalName] = useState('');
  const [publicName, setPublicName] = useState('');
  const [publicDescription, setPublicDescription] = useState('');

  // Campaign Period
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAlwaysActive, setIsAlwaysActive] = useState(false);

  // Voucher Logic - Stacking Rules
  const [voucherStackingLogic, setVoucherStackingLogic] = useState('allow_additionally');

  // Voucher Logic - Priority
  const [voucherPriority, setVoucherPriority] = useState('vouchers_first');

  // Contract sources
  const [sources, setSources] = useState([]);

  // Membership Fee Discounts
  const [membershipDiscounts, setMembershipDiscounts] = useState([]);

  // Flat Fee Discounts
  const [flatFeeDiscounts, setFlatFeeDiscounts] = useState([]);

  // Module Discounts
  const [moduleDiscounts, setModuleDiscounts] = useState([]);

  // Expanded state for collapsible blocks
  const [expandedMembershipDiscounts, setExpandedMembershipDiscounts] = useState({});
  const [expandedFlatFeeDiscounts, setExpandedFlatFeeDiscounts] = useState({});
  const [expandedModuleDiscounts, setExpandedModuleDiscounts] = useState({});

  // Refs for value inputs - must be at top level to avoid hook order issues
  const membershipValueInputRefs = useRef({});
  const membershipStarterPackageValueInputRefs = useRef({});
  const flatFeeValueInputRefs = useRef({});
  const moduleValueInputRefs = useRef({});

  // Mock data for dropdowns
  const membershipOffers = ['All', 'Premium', 'Standard', 'Basic'];
  const terms = ['All', '1 month', '3 months', '6 months', '12 months', '24 months'];
  const paymentFrequencies = ['All', 'Monthly', 'Quarterly', 'Semi-annually', 'Annually'];
  const durations = ['Permanent', 'Minimum duration', 'Month(s)'];
  const discountTypes = ['Substitute price', 'Percentage', 'Absolute Discount'];
  const flatFees = ['All', 'Registration fee', 'Admin fee', 'Card fee'];
  const modules = ['All', 'Personal Training', 'Group Classes', 'Sauna', 'Swimming Pool'];
  const facilities = ['Facility A', 'Facility B', 'Facility C'];
  
  // Source options
  const sourceOptions = [
    'Open API',
    'Sales tool',
    'My sport',
    'Landing page'
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSave = async () => {
    // Validate required fields (skip date validation if always active)
    if (!internalName.trim() || !publicName.trim() || (!isAlwaysActive && !startDate)) {
      setActiveTab(0); // Switch to Basic Info tab
      alert(!isAlwaysActive ? 'Please fill in all required fields: Internal name, Public name, and Start date' : 'Please fill in all required fields: Internal name and Public name');
      return;
    }
    
    // Validate end date is not before start date (skip if always active)
    if (!isAlwaysActive && endDate && startDate && new Date(endDate) < new Date(startDate)) {
      setActiveTab(0);
      alert('End date must not be earlier than start date');
      return;
    }
    
    setSaving(true);
    
    try {
      // Format the campaign data for the API
      const campaignData = {
        name: publicName,
        status: 'Active',
        facilitiesCount: 1, // This would be calculated based on facilities selected
        startDate: isAlwaysActive ? null : startDate,
        endDate: isAlwaysActive ? null : (endDate || null),
        isAlwaysActive: isAlwaysActive,
        discountPeriod: isAlwaysActive ? 'Always Active' : (endDate ? `${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}` : `${new Date(startDate).toLocaleDateString('de-DE')} - Ongoing`),
        combinationWithVouchers: voucherStackingLogic === 'allow_additionally',
        description: publicDescription || '',
        membershipDiscounts: membershipDiscounts.map(d => ({
          id: `m${d.id}`,
          membershipOffer: d.membershipOfferId,
          terms: d.selectedTerm,
          paymentFrequency: d.selectedFrequency,
          discountType: d.discountType.replace('_', ' '),
          value: d.discountType === 'percentage' ? Number(d.value) : d.value,
          ...(d.facilityPrices.length > 0 && {
            facilityPrices: d.facilityPrices.map(fp => ({
              facility: fp.facility,
              price: `${fp.value} €`
            }))
          }),
          ...(d.starterPackageEnabled && {
            starterPackage: {
              enabled: true,
              type: d.starterPackageType?.replace('_', ' '),
              value: d.starterPackageValue ? Number(d.starterPackageValue) : null,
              ...(d.starterPackageFacilities.length > 0 && {
                facilityPrices: d.starterPackageFacilities.map(fp => ({
                  facility: fp.facility,
                  price: `${fp.value} €`
                }))
              })
            }
          })
        })),
        flatFeeDiscounts: flatFeeDiscounts.map(d => ({
          id: `f${d.id}`,
          membershipOffer: d.membershipOfferId,
          terms: d.selectedTerm,
          paymentFrequency: d.selectedFrequency,
          flatFeeType: d.selectedFlatFee,
          duration: d.durationType === 'permanent' ? 'Permanent' : d.durationType,
          discountType: d.discountType.replace('_', ' '),
          value: d.discountType === 'percentage' ? Number(d.value) : d.value,
          ...(d.facilityPrices.length > 0 && {
            facilityPrices: d.facilityPrices.map(fp => ({
              facility: fp.facility,
              price: `${fp.value} €`
            }))
          })
        })),
        moduleDiscounts: moduleDiscounts.map(d => ({
          id: `mod${d.id}`,
          membershipOffer: d.membershipOfferId,
          terms: d.selectedTerm,
          paymentFrequency: d.selectedFrequency,
          moduleName: d.selectedModule,
          duration: d.durationType === 'permanent' ? 'Permanent' : d.durationType,
          discountType: d.discountType.replace('_', ' '),
          value: d.discountType === 'percentage' ? Number(d.value) : d.value,
        }))
      };
      
      console.log('Attempting to save campaign to MockAPI:', campaignData);
      
      // Call addCampaign and wait for the response
      const savedCampaign = await addCampaign(campaignData);
      
      console.log('Campaign saved successfully to MockAPI:', savedCampaign);
      
      // Only call onComplete and navigate after successful save
      onComplete();
      navigate('/settings/discount-campaigns');
    } catch (error) {
      console.error('Failed to save campaign to MockAPI:', error);
      alert(`Failed to save campaign. Error: ${error.message || 'Unknown error'}. Please try again.`);
      // Don't call onComplete() or navigate on error
    } finally {
      setSaving(false);
    }
  };

  const handleSourceChange = (event) => {
    const {
      target: { value },
    } = event;
    setSources(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const addMembershipDiscount = () => {
    const newId = Date.now();
    setMembershipDiscounts([
      ...membershipDiscounts,
      {
        id: newId,
        membershipOfferId: 'All',
        selectedTerm: 'All',
        selectedFrequency: 'All',
        durationType: 'permanent',
        durationMonths: '',
        durationMinimum: '',
        discountType: 'percentage',
        value: '',
        facilityPrices: [],
        starterPackageEnabled: false,
        starterPackageType: null,
        starterPackageValue: null,
        starterPackageFacilities: [],
      },
    ]);
    // Set the first discount as expanded by default
    if (membershipDiscounts.length === 0) {
      setExpandedMembershipDiscounts({ [newId]: true });
    }
  };

  const updateMembershipDiscount = (id, field, value) => {
    setMembershipDiscounts(prevDiscounts =>
      prevDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addFacilityPrice = (discountId) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: [
                ...d.facilityPrices,
                { id: Date.now(), facility: '', value: '' },
              ],
            }
          : d
      )
    );
  };

  const updateFacilityPrice = (discountId, facilityId, field, value) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: d.facilityPrices.map((f) =>
                f.id === facilityId ? { ...f, [field]: value } : f
              ),
            }
          : d
      )
    );
  };

  const deleteFacilityPrice = (discountId, facilityId) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: d.facilityPrices.filter((f) => f.id !== facilityId),
            }
          : d
      )
    );
  };

  const deleteMembershipDiscount = (id) => {
    setMembershipDiscounts(membershipDiscounts.filter((d) => d.id !== id));
  };

  const addStarterPackageFacilityPrice = (discountId) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              starterPackageFacilities: [
                ...d.starterPackageFacilities,
                { id: Date.now(), facility: '', value: '' },
              ],
            }
          : d
      )
    );
  };

  const updateStarterPackageFacilityPrice = (discountId, facilityId, field, value) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              starterPackageFacilities: d.starterPackageFacilities.map((f) =>
                f.id === facilityId ? { ...f, [field]: value } : f
              ),
            }
          : d
      )
    );
  };

  const deleteStarterPackageFacilityPrice = (discountId, facilityId) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              starterPackageFacilities: d.starterPackageFacilities.filter((f) => f.id !== facilityId),
            }
          : d
      )
    );
  };

  const addFlatFeeDiscount = () => {
    const newId = Date.now();
    setFlatFeeDiscounts([
      ...flatFeeDiscounts,
      {
        id: newId,
        membershipOfferId: 'All',
        selectedTerm: 'All',
        selectedFrequency: 'All',
        selectedFlatFee: 'All',
        flatFeeType: 'one_time',
        durationType: 'permanent',
        durationMonths: '',
        durationMinimum: '',
        discountType: 'percentage',
        value: '',
        facilityPrices: [],
      },
    ]);
    // Set the first discount as expanded by default
    if (flatFeeDiscounts.length === 0) {
      setExpandedFlatFeeDiscounts({ [newId]: true });
    }
  };

  const updateFlatFeeDiscount = (id, field, value) => {
    setFlatFeeDiscounts(prevDiscounts =>
      prevDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addFlatFeeFacilityPrice = (discountId) => {
    setFlatFeeDiscounts(
      flatFeeDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: [
                ...d.facilityPrices,
                { id: Date.now(), facility: '', value: '' },
              ],
            }
          : d
      )
    );
  };

  const updateFlatFeeFacilityPrice = (discountId, facilityId, field, value) => {
    setFlatFeeDiscounts(
      flatFeeDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: d.facilityPrices.map((f) =>
                f.id === facilityId ? { ...f, [field]: value } : f
              ),
            }
          : d
      )
    );
  };

  const deleteFlatFeeFacilityPrice = (discountId, facilityId) => {
    setFlatFeeDiscounts(
      flatFeeDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: d.facilityPrices.filter((f) => f.id !== facilityId),
            }
          : d
      )
    );
  };

  const deleteFlatFeeDiscount = (id) => {
    setFlatFeeDiscounts(flatFeeDiscounts.filter((d) => d.id !== id));
  };

  const addModuleDiscount = () => {
    const newId = Date.now();
    setModuleDiscounts([
      ...moduleDiscounts,
      {
        id: newId,
        membershipOfferId: 'All',
        selectedTerm: 'All',
        selectedFrequency: 'All',
        selectedModule: 'All',
        moduleType: 'one_time',
        durationType: 'permanent',
        durationMonths: '',
        durationMinimum: '',
        discountType: 'percentage',
        value: '',
        facilityPrices: [],
      },
    ]);
    // Set the first discount as expanded by default
    if (moduleDiscounts.length === 0) {
      setExpandedModuleDiscounts({ [newId]: true });
    }
  };

  const updateModuleDiscount = (id, field, value) => {
    setModuleDiscounts(prevDiscounts =>
      prevDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const addModuleFacilityPrice = (discountId) => {
    setModuleDiscounts(
      moduleDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: [
                ...d.facilityPrices,
                { id: Date.now(), facility: '', value: '' },
              ],
            }
          : d
      )
    );
  };

  const updateModuleFacilityPrice = (discountId, facilityId, field, value) => {
    setModuleDiscounts(
      moduleDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: d.facilityPrices.map((f) =>
                f.id === facilityId ? { ...f, [field]: value } : f
              ),
            }
          : d
      )
    );
  };

  const deleteModuleFacilityPrice = (discountId, facilityId) => {
    setModuleDiscounts(
      moduleDiscounts.map((d) =>
        d.id === discountId
          ? {
              ...d,
              facilityPrices: d.facilityPrices.filter((f) => f.id !== facilityId),
            }
          : d
      )
    );
  };

  const deleteModuleDiscount = (id) => {
    setModuleDiscounts(moduleDiscounts.filter((d) => d.id !== id));
  };

  // Clear both dates when always active campaign is enabled
  useEffect(() => {
    if (isAlwaysActive) {
      setStartDate('');
      setEndDate('');
    }
  }, [isAlwaysActive]);

  // Set all sources as selected by default when creating a new campaign
  useEffect(() => {
    if (sources.length === 0) {
      setSources(sourceOptions);
    }
  }, []);

  // Helper function to get dynamic value input configuration based on discount type
  const getValueInputConfig = (discountType) => {
    switch (discountType) {
      case 'percentage':
        return {
          label: 'Discount percentage',
          placeholder: 'Enter percentage',
          suffix: '%',
          min: 1,
          max: 100,
          step: 1,
          helperText: 'Value must be between 1 and 100',
        };
      case 'absolute_price':
        return {
          label: 'Discount amount',
          placeholder: 'Enter amount',
          suffix: '€',
          min: 0.01,
          max: undefined,
          step: 0.01,
          helperText: 'Value must be greater than 0',
        };
      case 'substitute_price':
        return {
          label: 'New price',
          placeholder: 'Enter new price',
          suffix: '€',
          min: 0.01,
          max: undefined,
          step: 0.01,
          helperText: 'Value must be greater than 0',
        };
      default:
        return {
          label: 'Value',
          placeholder: 'Enter value',
          suffix: '',
          min: 0,
          max: undefined,
          step: 0.01,
          helperText: '',
        };
    }
  };

  // Reusable Type + Value component
  const renderTypeAndValue = (discount, updateFunction, valueInputRef) => {
    const valueConfig = getValueInputConfig(discount.discountType);
    const isValueEnabled = Boolean(discount.discountType);
    
    // Validate value based on type
    const validateValue = (value) => {
      if (!value || value === '') return '';
      const numValue = parseFloat(value);
      
      if (discount.discountType === 'percentage') {
        if (numValue < 1 || numValue > 100) {
          return 'Value must be between 1 and 100';
        }
      } else if (discount.discountType === 'absolute_price' || discount.discountType === 'substitute_price') {
        if (numValue <= 0) {
          return 'Value must be greater than 0';
        }
      }
      return '';
    };
    
    const errorMessage = validateValue(discount.value);

    return (
      <Paper
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'neutral.200',
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
          Type + Value
        </Typography>
        
        <Grid container spacing={3}>
          {/* Type Column */}
          <Grid item xs={6}>
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel 
                component="legend" 
                sx={{ 
                  mb: 1.5, 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: 'text.primary' 
                }}
              >
                Discount type
              </FormLabel>
              <RadioGroup
                value={discount.discountType}
                onChange={(e) => {
                  const newType = e.target.value;
                  updateFunction(discount.id, 'discountType', newType);
                  // Clear value when changing type
                  updateFunction(discount.id, 'value', '');
                  // Auto-focus value input after type selection
                  setTimeout(() => {
                    if (valueInputRef && valueInputRef.current) {
                      valueInputRef.current.focus();
                    }
                  }, 100);
                }}
              >
                <FormControlLabel
                  value="substitute_price"
                  control={<Radio />}
                  label={<Typography variant="body2">Substitute price</Typography>}
                />
                <FormControlLabel
                  value="percentage"
                  control={<Radio />}
                  label={<Typography variant="body2">Percentage</Typography>}
                />
                <FormControlLabel
                  value="absolute_price"
                  control={<Radio />}
                  label={<Typography variant="body2">Absolute price</Typography>}
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Value Column */}
          <Grid item xs={6}>
            <FormControl fullWidth>
              <FormLabel 
                component="legend" 
                sx={{ 
                  mb: 1.5, 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: isValueEnabled ? 'text.primary' : 'text.disabled'
                }}
              >
                {valueConfig.label}
              </FormLabel>
              <TextField
                inputRef={valueInputRef}
                placeholder={valueConfig.placeholder}
                type="number"
                value={discount.value}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFunction(discount.id, 'value', value);
                }}
                size="small"
                disabled={!isValueEnabled}
                error={Boolean(errorMessage && discount.value)}
                helperText={
                  errorMessage && discount.value
                    ? errorMessage
                    : isValueEnabled
                    ? valueConfig.helperText
                    : 'Select a discount type first'
                }
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: valueConfig.suffix && isValueEnabled ? (
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: 'text.secondary',
                        ml: 1,
                        userSelect: 'none'
                      }}
                    >
                      {valueConfig.suffix}
                    </Typography>
                  ) : null,
                }}
                inputProps={{
                  min: valueConfig.min,
                  max: valueConfig.max,
                  step: valueConfig.step,
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: isValueEnabled ? 'background.paper' : 'action.disabledBackground',
                  },
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderBasicInfo = () => (
    <Box>
      {/* Basic Information Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Basic information
      </Typography>
      
      <TextField
        label="Internal name"
        value={internalName}
        onChange={(e) => setInternalName(e.target.value)}
        fullWidth
        required
        sx={{ mb: 3 }}
        InputLabelProps={{ shrink: Boolean(internalName) }}
      />
      
      <TextField
        label="Public name"
        value={publicName}
        onChange={(e) => setPublicName(e.target.value)}
        fullWidth
        required
        helperText="Displayed to end customers"
        sx={{ mb: 3 }}
        InputLabelProps={{ shrink: Boolean(publicName) }}
        InputProps={{
          endAdornment: (
            <TranslateRounded sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
          ),
        }}
      />
      
      <TextField
        label="Public description"
        value={publicDescription}
        onChange={(e) => setPublicDescription(e.target.value)}
        fullWidth
        multiline
        rows={3}
        helperText="Description visible to end customers"
        sx={{ mb: 4 }}
        InputLabelProps={{ shrink: Boolean(publicDescription) }}
        InputProps={{
          endAdornment: (
            <TranslateRounded 
              sx={{ 
                color: 'text.secondary', 
                fontSize: 20, 
                position: 'absolute',
                right: 16,
                top: 12
              }} 
            />
          ),
        }}
      />

      {/* Campaign Period Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Campaign period
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isAlwaysActive}
              onChange={(e) => setIsAlwaysActive(e.target.checked)}
            />
          }
          label="Always active"
          sx={{ mb: 0.5 }}
        />
        <FormHelperText sx={{ mt: 0.5, ml: 0 }}>
          This campaign has no start or end date when enabled.
        </FormHelperText>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Start date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isAlwaysActive}
          required={!isAlwaysActive}
          sx={{ flex: 1 }}
        />
        <TextField
          label="End date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isAlwaysActive}
          sx={{ flex: 1 }}
          inputProps={{ min: startDate }}
          error={!isAlwaysActive && endDate && startDate && new Date(endDate) < new Date(startDate)}
          helperText={!isAlwaysActive && endDate && startDate && new Date(endDate) < new Date(startDate) ? 'End date must not be earlier than start date' : ''}
        />
      </Box>

      {/* Contract Sources Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Contract sources
      </Typography>
      
      <Autocomplete
        multiple
        size="small"
        options={sourceOptions}
        value={sources}
        onChange={(event, newValue) => {
          setSources(newValue);
        }}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="Contract sources"
            placeholder={sources.length === 0 ? "Search or select sources" : ""}
          />
        )}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              checked={selected}
              sx={{ mr: 1 }}
            />
            <Typography variant="body2">{option}</Typography>
          </li>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option}
              label={option}
              size="small"
            />
          ))
        }
        sx={{ mb: 4 }}
      />

      {/* Voucher Logic Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Voucher logic
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: voucherStackingLogic === 'allow_additionally' ? 3 : 4 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
          Voucher behavior
        </FormLabel>
        <RadioGroup
          value={voucherStackingLogic}
          onChange={(e) => {
            const newValue = e.target.value;
            setVoucherStackingLogic(newValue);
            // Reset priority when not "Allow vouchers"
            if (newValue !== 'allow_additionally') {
              setVoucherPriority('vouchers_first');
            }
          }}
        >
          <Box>
            <FormControlLabel
              value="allow_additionally"
              control={<Radio />}
              label={<Typography variant="body2">Allow vouchers</Typography>}
            />
            <FormHelperText sx={{ ml: 4, mt: -0.5, mb: 1.5 }}>
              Vouchers can be applied together with this discount.
            </FormHelperText>
          </Box>
          <Box>
            <FormControlLabel
              value="replace_discount"
              control={<Radio />}
              label={<Typography variant="body2">Vouchers replace inherent discount</Typography>}
            />
            <FormHelperText sx={{ ml: 4, mt: -0.5, mb: 1.5 }}>
              When a voucher is applied, it replaces the campaign discount.
            </FormHelperText>
          </Box>
          <Box>
            <FormControlLabel
              value="disallow"
              control={<Radio />}
              label={<Typography variant="body2">Disallow vouchers</Typography>}
            />
            <FormHelperText sx={{ ml: 4, mt: -0.5, mb: 1.5 }}>
              Vouchers cannot be used with this discount.
            </FormHelperText>
          </Box>
        </RadioGroup>
      </FormControl>

      {/* Priority - Only shown when "Allow vouchers" is selected */}
      {voucherStackingLogic === 'allow_additionally' && (
        <FormControl component="fieldset" sx={{ mb: 4 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
            Priority
          </FormLabel>
          <RadioGroup
            value={voucherPriority}
            onChange={(e) => setVoucherPriority(e.target.value)}
          >
            <Box>
              <FormControlLabel
                value="discounts_first"
                control={<Radio />}
                label={<Typography variant="body2">Campaign discount first</Typography>}
              />
              <FormHelperText sx={{ ml: 4, mt: -0.5, mb: 1.5 }}>
                Apply the campaign discount before voucher discounts.
              </FormHelperText>
            </Box>
            <Box>
              <FormControlLabel
                value="vouchers_first"
                control={<Radio />}
                label={<Typography variant="body2">Vouchers first</Typography>}
              />
              <FormHelperText sx={{ ml: 4, mt: -0.5, mb: 1.5 }}>
                Apply voucher discounts before the campaign discount.
              </FormHelperText>
            </Box>
          </RadioGroup>
        </FormControl>
      )}
    </Box>
  );

  const renderMembershipFeeDiscounts = () => {
    return (
      <Box>
        {membershipDiscounts.length === 0 && (
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'neutral.200',
              borderRadius: 2,
              color: 'text.secondary',
              mb: 3,
            }}
          >
            <Typography variant="body2">
              No membership fee discounts configured yet. Click "Add a membership fee discount" to create one.
            </Typography>
          </Box>
        )}

        {membershipDiscounts.map((discount, index) => {
          // Initialize ref for this discount if it doesn't exist
          if (!membershipValueInputRefs.current[discount.id]) {
            membershipValueInputRefs.current[discount.id] = React.createRef();
          }
          
          return (
            <CollapsibleBlock
              key={discount.id}
              title={`Membership Fee Discount ${index + 1}`}
              summary={buildMembershipDiscountSummary(discount)}
              expanded={expandedMembershipDiscounts[discount.id] || false}
              onToggle={() => {
                setExpandedMembershipDiscounts(prev => ({
                  ...prev,
                  [discount.id]: !prev[discount.id]
                }));
              }}
              onDelete={() => deleteMembershipDiscount(discount.id)}
            >

          {/* Membership offer, Term, Payment frequency in one row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Autocomplete
                size="small"
                options={membershipOffers}
                value={discount.membershipOfferId}
                onChange={(event, newValue) => {
                  const selectedOffer = newValue || 'All';
                  updateMembershipDiscount(discount.id, 'membershipOfferId', selectedOffer);
                  
                  // Auto-disable logic
                  if (selectedOffer === 'All') {
                    updateMembershipDiscount(discount.id, 'selectedTerm', 'All');
                    updateMembershipDiscount(discount.id, 'selectedFrequency', 'All');
                  } else {
                    // Reset dependent fields when switching from "All" to specific offer
                    updateMembershipDiscount(discount.id, 'selectedTerm', '');
                    updateMembershipDiscount(discount.id, 'selectedFrequency', '');
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Membership offer" />}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={4}>
              <Tooltip
                title={discount.membershipOfferId === 'All' ? "This field is automatically set to All when selecting 'All membership offers'." : ""}
                arrow
                placement="top"
              >
                <Box>
                  <Autocomplete
                    size="small"
                    options={terms}
                    value={discount.selectedTerm}
                    onChange={(event, newValue) => {
                      updateMembershipDiscount(discount.id, 'selectedTerm', newValue || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Term" />}
                    fullWidth
                    disabled={discount.membershipOfferId === 'All'}
                    sx={{
                      '& .MuiInputBase-root': {
                        opacity: discount.membershipOfferId === 'All' ? 0.6 : 1,
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
            
            <Grid item xs={4}>
              <Tooltip
                title={discount.membershipOfferId === 'All' ? "This field is automatically set to All when selecting 'All membership offers'." : ""}
                arrow
                placement="top"
              >
                <Box>
                  <Autocomplete
                    size="small"
                    options={paymentFrequencies}
                    value={discount.selectedFrequency}
                    onChange={(event, newValue) => {
                      updateMembershipDiscount(discount.id, 'selectedFrequency', newValue || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Payment frequency" />}
                    fullWidth
                    disabled={discount.membershipOfferId === 'All'}
                    sx={{
                      '& .MuiInputBase-root': {
                        opacity: discount.membershipOfferId === 'All' ? 0.6 : 1,
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
          </Grid>

          {/* Duration */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Duration
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.durationType}
              onChange={(e) =>
                updateMembershipDiscount(discount.id, 'durationType', e.target.value)
              }
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                  <FormControlLabel
                    value="months"
                    control={<Radio />}
                    label={<Typography variant="body2">Months</Typography>}
                    sx={{ mr: 0 }}
                  />
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMonths}
                    onChange={(e) =>
                      updateMembershipDiscount(discount.id, 'durationMonths', e.target.value)
                    }
                    size="small"
                    disabled={discount.durationType !== 'months'}
                    sx={{ 
                      width: 200,
                      '& .MuiInputBase-root': {
                        backgroundColor: discount.durationType !== 'months' ? 'action.disabledBackground' : 'background.paper',
                      },
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1, step: 1 }}
                  />
                </Box>
                <FormHelperText sx={{ ml: 4, mt: 0.5, mb: 1.5 }}>
                  Applies the discount for a selected number of months.
                </FormHelperText>
              </Box>
              <Box>
                <FormControlLabel
                  value="permanent"
                  control={<Radio />}
                  label={<Typography variant="body2">Permanent</Typography>}
                  sx={{ mb: 0.5 }}
                />
                <FormHelperText sx={{ ml: 4, mt: 0.5, mb: 1.5 }}>
                  This discount applies for the entire duration of the membership offer.
                </FormHelperText>
              </Box>
              <Box>
                <FormControlLabel
                  value="minimum_duration"
                  control={<Radio />}
                  label={<Typography variant="body2">Minimum duration</Typography>}
                  sx={{ mb: 0.5 }}
                />
                <FormHelperText sx={{ ml: 4, mt: 0.5 }}>
                  The minimum duration is defined by the selected membership offer.
                </FormHelperText>
              </Box>
            </RadioGroup>
          </FormControl>

          {/* Type + Value */}
          {renderTypeAndValue(discount, updateMembershipDiscount, membershipValueInputRefs.current[discount.id])}

          {/* Facility based price */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Facility based price
          </Typography>
          <Box sx={{ mb: 3 }}>
            {discount.facilityPrices.map((facilityPrice) => (
              <Box
                key={facilityPrice.id}
                sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}
              >
                <FormControl sx={{ flex: 1 }} size="small">
                  <InputLabel>Facility</InputLabel>
                  <Select
                    label="Facility"
                    value={facilityPrice.facility}
                    onChange={(e) =>
                      updateFacilityPrice(
                        discount.id,
                        facilityPrice.id,
                        'facility',
                        e.target.value
                      )
                    }
                  >
                    {facilities.map((facility) => (
                      <MenuItem key={facility} value={facility}>
                        {facility}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Value"
                  type="number"
                  value={facilityPrice.value}
                  onChange={(e) =>
                    updateFacilityPrice(discount.id, facilityPrice.id, 'value', e.target.value)
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <IconButton
                  size="small"
                  onClick={() => deleteFacilityPrice(discount.id, facilityPrice.id)}
                  sx={{ color: 'error.main', mt: 0.5 }}
                >
                  <DeleteRounded />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={() => addFacilityPrice(discount.id)}
              sx={{ textTransform: 'none' }}
            >
              Add facility substitute based price
            </Button>
          </Box>

          {/* Starter package */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Starter package
            </Typography>
            <Switch
              checked={discount.starterPackageEnabled}
              onChange={(e) => {
                const isEnabled = e.target.checked;
                updateMembershipDiscount(discount.id, 'starterPackageEnabled', isEnabled);
                
                if (isEnabled) {
                  // Initialize defaults when turning ON
                  updateMembershipDiscount(discount.id, 'starterPackageType', 'percentage');
                  updateMembershipDiscount(discount.id, 'starterPackageValue', '');
                  updateMembershipDiscount(discount.id, 'starterPackageFacilities', []);
                } else {
                  // Reset all fields when turning OFF
                  updateMembershipDiscount(discount.id, 'starterPackageType', null);
                  updateMembershipDiscount(discount.id, 'starterPackageValue', null);
                  updateMembershipDiscount(discount.id, 'starterPackageFacilities', []);
                }
              }}
            />
          </Box>

          {discount.starterPackageEnabled && (() => {
            // Initialize ref for starter package if it doesn't exist
            if (!membershipStarterPackageValueInputRefs.current[discount.id]) {
              membershipStarterPackageValueInputRefs.current[discount.id] = React.createRef();
            }
            
            // Create a temporary discount object that matches the renderTypeAndValue expectations
            const starterPackageDiscount = {
              id: discount.id,
              discountType: discount.starterPackageType === 'absolute_discount' 
                ? 'absolute_price' 
                : discount.starterPackageType,
              value: discount.starterPackageValue,
            };
            
            // Create update function for starter package
            const updateStarterPackage = (id, field, value) => {
              if (field === 'discountType') {
                // Map back to the stored format
                const mappedType = value === 'absolute_price' ? 'absolute_discount' : value;
                updateMembershipDiscount(id, 'starterPackageType', mappedType);
              } else if (field === 'value') {
                updateMembershipDiscount(id, 'starterPackageValue', value);
              }
            };
            
            return (
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'neutral.200',
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                }}
              >
                {/* Type + Value */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                  Type + Value
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Type Column */}
                  <Grid item xs={6}>
                    <FormControl component="fieldset" sx={{ width: '100%' }}>
                      <FormLabel 
                        component="legend" 
                        sx={{ 
                          mb: 1.5, 
                          fontSize: 14, 
                          fontWeight: 500, 
                          color: 'text.primary' 
                        }}
                      >
                        Discount type
                      </FormLabel>
                      <RadioGroup
                        value={starterPackageDiscount.discountType || ''}
                        onChange={(e) => {
                          const newType = e.target.value;
                          updateStarterPackage(discount.id, 'discountType', newType);
                          // Clear value when changing type
                          updateStarterPackage(discount.id, 'value', '');
                          // Auto-focus value input after type selection
                          setTimeout(() => {
                            if (membershipStarterPackageValueInputRefs.current[discount.id] && 
                                membershipStarterPackageValueInputRefs.current[discount.id].current) {
                              membershipStarterPackageValueInputRefs.current[discount.id].current.focus();
                            }
                          }, 100);
                        }}
                      >
                        <FormControlLabel
                          value="substitute_price"
                          control={<Radio />}
                          label={<Typography variant="body2">Substitute price</Typography>}
                        />
                        <FormControlLabel
                          value="percentage"
                          control={<Radio />}
                          label={<Typography variant="body2">Percentage</Typography>}
                        />
                        <FormControlLabel
                          value="absolute_price"
                          control={<Radio />}
                          label={<Typography variant="body2">Absolute discount</Typography>}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {/* Value Column */}
                  <Grid item xs={6}>
                    {(() => {
                      const valueConfig = getValueInputConfig(starterPackageDiscount.discountType);
                      const isValueEnabled = Boolean(starterPackageDiscount.discountType);
                      
                      // Validate value based on type
                      const validateValue = (value) => {
                        if (!value || value === '') return '';
                        const numValue = parseFloat(value);
                        
                        if (starterPackageDiscount.discountType === 'percentage') {
                          if (numValue < 1 || numValue > 100) {
                            return 'Value must be between 1 and 100';
                          }
                        } else if (starterPackageDiscount.discountType === 'absolute_price' || 
                                   starterPackageDiscount.discountType === 'substitute_price') {
                          if (numValue <= 0) {
                            return 'Value must be greater than 0';
                          }
                        }
                        return '';
                      };
                      
                      const errorMessage = validateValue(starterPackageDiscount.value);

                      return (
                        <FormControl fullWidth>
                          <FormLabel 
                            component="legend" 
                            sx={{ 
                              mb: 1.5, 
                              fontSize: 14, 
                              fontWeight: 500, 
                              color: isValueEnabled ? 'text.primary' : 'text.disabled'
                            }}
                          >
                            {valueConfig.label}
                          </FormLabel>
                          <TextField
                            inputRef={membershipStarterPackageValueInputRefs.current[discount.id]}
                            placeholder={valueConfig.placeholder}
                            type="number"
                            value={starterPackageDiscount.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateStarterPackage(discount.id, 'value', value);
                            }}
                            size="small"
                            disabled={!isValueEnabled}
                            error={Boolean(errorMessage && starterPackageDiscount.value)}
                            helperText={
                              errorMessage && starterPackageDiscount.value
                                ? errorMessage
                                : isValueEnabled
                                ? valueConfig.helperText
                                : 'Select a discount type first'
                            }
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              endAdornment: valueConfig.suffix && isValueEnabled ? (
                                <Typography
                                  variant="body2"
                                  sx={{ 
                                    color: 'text.secondary',
                                    ml: 1,
                                    userSelect: 'none'
                                  }}
                                >
                                  {valueConfig.suffix}
                                </Typography>
                              ) : null,
                            }}
                            inputProps={{
                              min: valueConfig.min,
                              max: valueConfig.max,
                              step: valueConfig.step,
                            }}
                            sx={{
                              '& .MuiInputBase-root': {
                                backgroundColor: isValueEnabled ? 'background.paper' : 'action.disabledBackground',
                              },
                            }}
                          />
                        </FormControl>
                      );
                    })()}
                  </Grid>
                </Grid>

                {/* Facility based price */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                  Facility based price
                </Typography>
                <Box>
                  {discount.starterPackageFacilities.map((facilityPrice) => (
                    <Box
                      key={facilityPrice.id}
                      sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}
                    >
                      <FormControl sx={{ flex: 1 }} size="small">
                        <InputLabel>Facility</InputLabel>
                        <Select
                          label="Facility"
                          value={facilityPrice.facility}
                          onChange={(e) =>
                            updateStarterPackageFacilityPrice(
                              discount.id,
                              facilityPrice.id,
                              'facility',
                              e.target.value
                            )
                          }
                        >
                          {facilities.map((facility) => (
                            <MenuItem key={facility} value={facility}>
                              {facility}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Value"
                        type="number"
                        value={facilityPrice.value}
                        onChange={(e) =>
                          updateStarterPackageFacilityPrice(discount.id, facilityPrice.id, 'value', e.target.value)
                        }
                        size="small"
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => deleteStarterPackageFacilityPrice(discount.id, facilityPrice.id)}
                        sx={{ color: 'error.main', mt: 0.5 }}
                      >
                        <DeleteRounded />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddRounded />}
                    onClick={() => addStarterPackageFacilityPrice(discount.id)}
                    sx={{ textTransform: 'none' }}
                  >
                    Add facility substitute based price
                  </Button>
                </Box>
              </Paper>
            );
          })()}
            </CollapsibleBlock>
          );
        })}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={addMembershipDiscount}
            sx={{ textTransform: 'none' }}
          >
            Add a membership fee discount
          </Button>
        </Box>
      </Box>
    );
  };

  const renderFlatFeeDiscounts = () => {
    return (
      <Box>
        {flatFeeDiscounts.length === 0 && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'neutral.200',
            borderRadius: 2,
            color: 'text.secondary',
            mb: 3,
          }}
        >
          <Typography variant="body2">
            No flat fee discounts configured yet. Click "Add a flat fee discount" to create one.
          </Typography>
        </Box>
      )}

      {flatFeeDiscounts.map((discount, index) => {
        // Initialize ref for this discount if it doesn't exist
        if (!flatFeeValueInputRefs.current[discount.id]) {
          flatFeeValueInputRefs.current[discount.id] = React.createRef();
        }
        
        return (
          <CollapsibleBlock
            key={discount.id}
            title={`Flat Fee Discount ${index + 1}`}
            summary={buildFlatFeeDiscountSummary(discount)}
            expanded={expandedFlatFeeDiscounts[discount.id] || false}
            onToggle={() => {
              setExpandedFlatFeeDiscounts(prev => ({
                ...prev,
                [discount.id]: !prev[discount.id]
              }));
            }}
            onDelete={() => deleteFlatFeeDiscount(discount.id)}
          >

          {/* Membership offer, Term, Payment frequency in one row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Autocomplete
                size="small"
                options={membershipOffers}
                value={discount.membershipOfferId}
                onChange={(event, newValue) => {
                  const selectedOffer = newValue || 'All';
                  updateFlatFeeDiscount(discount.id, 'membershipOfferId', selectedOffer);
                  
                  // Auto-disable logic
                  if (selectedOffer === 'All') {
                    updateFlatFeeDiscount(discount.id, 'selectedTerm', 'All');
                    updateFlatFeeDiscount(discount.id, 'selectedFrequency', 'All');
                  } else {
                    // Reset dependent fields when switching from "All" to specific offer
                    updateFlatFeeDiscount(discount.id, 'selectedTerm', '');
                    updateFlatFeeDiscount(discount.id, 'selectedFrequency', '');
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Membership offer" />}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={4}>
              <Tooltip
                title={discount.membershipOfferId === 'All' ? "This field is automatically set to All when selecting 'All membership offers'." : ""}
                arrow
                placement="top"
              >
                <Box>
                  <Autocomplete
                    size="small"
                    options={terms}
                    value={discount.selectedTerm}
                    onChange={(event, newValue) => {
                      updateFlatFeeDiscount(discount.id, 'selectedTerm', newValue || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Term" />}
                    fullWidth
                    disabled={discount.membershipOfferId === 'All'}
                    sx={{
                      '& .MuiInputBase-root': {
                        opacity: discount.membershipOfferId === 'All' ? 0.6 : 1,
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
            
            <Grid item xs={4}>
              <Tooltip
                title={discount.membershipOfferId === 'All' ? "This field is automatically set to All when selecting 'All membership offers'." : ""}
                arrow
                placement="top"
              >
                <Box>
                  <Autocomplete
                    size="small"
                    options={paymentFrequencies}
                    value={discount.selectedFrequency}
                    onChange={(event, newValue) => {
                      updateFlatFeeDiscount(discount.id, 'selectedFrequency', newValue || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Payment frequency" />}
                    fullWidth
                    disabled={discount.membershipOfferId === 'All'}
                    sx={{
                      '& .MuiInputBase-root': {
                        opacity: discount.membershipOfferId === 'All' ? 0.6 : 1,
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
          </Grid>

          {/* Flat fee */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Flat fee
          </Typography>
          <Autocomplete
            size="small"
            options={flatFees}
            value={discount.selectedFlatFee}
            onChange={(event, newValue) => {
              updateFlatFeeDiscount(discount.id, 'selectedFlatFee', newValue || 'All');
            }}
            renderInput={(params) => <TextField {...params} label="Flat fee type" />}
            fullWidth
            sx={{ mb: 3 }}
          />

          {/* Duration */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Duration
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.durationType}
              onChange={(e) =>
                updateFlatFeeDiscount(discount.id, 'durationType', e.target.value)
              }
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                  <FormControlLabel
                    value="months"
                    control={<Radio />}
                    label={<Typography variant="body2">Months</Typography>}
                    sx={{ mr: 0 }}
                  />
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMonths}
                    onChange={(e) =>
                      updateFlatFeeDiscount(discount.id, 'durationMonths', e.target.value)
                    }
                    size="small"
                    disabled={discount.durationType !== 'months'}
                    sx={{ 
                      width: 200,
                      '& .MuiInputBase-root': {
                        backgroundColor: discount.durationType !== 'months' ? 'action.disabledBackground' : 'background.paper',
                      },
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1, step: 1 }}
                  />
                </Box>
                <FormHelperText sx={{ ml: 4, mt: 0.5, mb: 1.5 }}>
                  Applies the discount for a selected number of months.
                </FormHelperText>
              </Box>
              <Box>
                <FormControlLabel
                  value="permanent"
                  control={<Radio />}
                  label={<Typography variant="body2">Permanent</Typography>}
                  sx={{ mb: 0.5 }}
                />
                <FormHelperText sx={{ ml: 4, mt: 0.5, mb: 1.5 }}>
                  This discount applies for the entire duration of the membership offer.
                </FormHelperText>
              </Box>
              <Box>
                <FormControlLabel
                  value="minimum_duration"
                  control={<Radio />}
                  label={<Typography variant="body2">Minimum duration</Typography>}
                  sx={{ mb: 0.5 }}
                />
                <FormHelperText sx={{ ml: 4, mt: 0.5 }}>
                  The minimum duration is defined by the selected membership offer.
                </FormHelperText>
              </Box>
            </RadioGroup>
          </FormControl>

          {/* Type + Value */}
          {renderTypeAndValue(discount, updateFlatFeeDiscount, flatFeeValueInputRefs.current[discount.id])}

          {/* Facility based price */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Facility based price
          </Typography>
          <Box sx={{ mb: 3 }}>
            {discount.facilityPrices.map((facilityPrice) => (
              <Box
                key={facilityPrice.id}
                sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}
              >
                <FormControl sx={{ flex: 1 }} size="small">
                  <InputLabel>Facility</InputLabel>
                  <Select
                    label="Facility"
                    value={facilityPrice.facility}
                    onChange={(e) =>
                      updateFlatFeeFacilityPrice(
                        discount.id,
                        facilityPrice.id,
                        'facility',
                        e.target.value
                      )
                    }
                  >
                    {facilities.map((facility) => (
                      <MenuItem key={facility} value={facility}>
                        {facility}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Value"
                  type="number"
                  value={facilityPrice.value}
                  onChange={(e) =>
                    updateFlatFeeFacilityPrice(discount.id, facilityPrice.id, 'value', e.target.value)
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <IconButton
                  size="small"
                  onClick={() => deleteFlatFeeFacilityPrice(discount.id, facilityPrice.id)}
                  sx={{ color: 'error.main', mt: 0.5 }}
                >
                  <DeleteRounded />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={() => addFlatFeeFacilityPrice(discount.id)}
              sx={{ textTransform: 'none' }}
            >
              Add facility substitute based price
            </Button>
          </Box>
          </CollapsibleBlock>
        );
      })}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={addFlatFeeDiscount}
          sx={{ textTransform: 'none' }}
        >
          Add a flat fee discount
        </Button>
      </Box>
    </Box>
    );
  };

  const renderModuleDiscounts = () => {
    return (
      <Box>
        {moduleDiscounts.length === 0 && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'neutral.200',
            borderRadius: 2,
            color: 'text.secondary',
            mb: 3,
          }}
        >
          <Typography variant="body2">
            No additional modules discounts configured yet. Click "Add a flat fee discount" to create one.
          </Typography>
        </Box>
      )}

      {moduleDiscounts.map((discount, index) => {
        // Initialize ref for this discount if it doesn't exist
        if (!moduleValueInputRefs.current[discount.id]) {
          moduleValueInputRefs.current[discount.id] = React.createRef();
        }
        
        return (
          <CollapsibleBlock
            key={discount.id}
            title={`Module Discount ${index + 1}`}
            summary={buildModuleDiscountSummary(discount)}
            expanded={expandedModuleDiscounts[discount.id] || false}
            onToggle={() => {
              setExpandedModuleDiscounts(prev => ({
                ...prev,
                [discount.id]: !prev[discount.id]
              }));
            }}
            onDelete={() => deleteModuleDiscount(discount.id)}
          >

          {/* Membership offer, Term, Payment frequency in one row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Autocomplete
                size="small"
                options={membershipOffers}
                value={discount.membershipOfferId}
                onChange={(event, newValue) => {
                  const selectedOffer = newValue || 'All';
                  updateModuleDiscount(discount.id, 'membershipOfferId', selectedOffer);
                  
                  // Auto-disable logic
                  if (selectedOffer === 'All') {
                    updateModuleDiscount(discount.id, 'selectedTerm', 'All');
                    updateModuleDiscount(discount.id, 'selectedFrequency', 'All');
                  } else {
                    // Reset dependent fields when switching from "All" to specific offer
                    updateModuleDiscount(discount.id, 'selectedTerm', '');
                    updateModuleDiscount(discount.id, 'selectedFrequency', '');
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Membership offer" />}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={4}>
              <Tooltip
                title={discount.membershipOfferId === 'All' ? "This field is automatically set to All when selecting 'All membership offers'." : ""}
                arrow
                placement="top"
              >
                <Box>
                  <Autocomplete
                    size="small"
                    options={terms}
                    value={discount.selectedTerm}
                    onChange={(event, newValue) => {
                      updateModuleDiscount(discount.id, 'selectedTerm', newValue || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Term" />}
                    fullWidth
                    disabled={discount.membershipOfferId === 'All'}
                    sx={{
                      '& .MuiInputBase-root': {
                        opacity: discount.membershipOfferId === 'All' ? 0.6 : 1,
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
            
            <Grid item xs={4}>
              <Tooltip
                title={discount.membershipOfferId === 'All' ? "This field is automatically set to All when selecting 'All membership offers'." : ""}
                arrow
                placement="top"
              >
                <Box>
                  <Autocomplete
                    size="small"
                    options={paymentFrequencies}
                    value={discount.selectedFrequency}
                    onChange={(event, newValue) => {
                      updateModuleDiscount(discount.id, 'selectedFrequency', newValue || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Payment frequency" />}
                    fullWidth
                    disabled={discount.membershipOfferId === 'All'}
                    sx={{
                      '& .MuiInputBase-root': {
                        opacity: discount.membershipOfferId === 'All' ? 0.6 : 1,
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
          </Grid>

          {/* Additional modules */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Additional modules
          </Typography>
          <Autocomplete
            size="small"
            options={modules}
            value={discount.selectedModule}
            onChange={(event, newValue) => {
              updateModuleDiscount(discount.id, 'selectedModule', newValue || 'All');
            }}
            renderInput={(params) => <TextField {...params} label="Module type" />}
            fullWidth
            sx={{ mb: 3 }}
          />

          {/* Duration */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Duration
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.durationType}
              onChange={(e) =>
                updateModuleDiscount(discount.id, 'durationType', e.target.value)
              }
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                  <FormControlLabel
                    value="months"
                    control={<Radio />}
                    label={<Typography variant="body2">Months</Typography>}
                    sx={{ mr: 0 }}
                  />
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMonths}
                    onChange={(e) =>
                      updateModuleDiscount(discount.id, 'durationMonths', e.target.value)
                    }
                    size="small"
                    disabled={discount.durationType !== 'months'}
                    sx={{ 
                      width: 200,
                      '& .MuiInputBase-root': {
                        backgroundColor: discount.durationType !== 'months' ? 'action.disabledBackground' : 'background.paper',
                      },
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1, step: 1 }}
                  />
                </Box>
                <FormHelperText sx={{ ml: 4, mt: 0.5, mb: 1.5 }}>
                  Applies the discount for a selected number of months.
                </FormHelperText>
              </Box>
              <Box>
                <FormControlLabel
                  value="permanent"
                  control={<Radio />}
                  label={<Typography variant="body2">Permanent</Typography>}
                  sx={{ mb: 0.5 }}
                />
                <FormHelperText sx={{ ml: 4, mt: 0.5, mb: 1.5 }}>
                  This discount applies for the entire duration of the membership offer.
                </FormHelperText>
              </Box>
              <Box>
                <FormControlLabel
                  value="minimum_duration"
                  control={<Radio />}
                  label={<Typography variant="body2">Minimum duration</Typography>}
                  sx={{ mb: 0.5 }}
                />
                <FormHelperText sx={{ ml: 4, mt: 0.5 }}>
                  The minimum duration is defined by the selected membership offer.
                </FormHelperText>
              </Box>
            </RadioGroup>
          </FormControl>

          {/* Type + Value */}
          {renderTypeAndValue(discount, updateModuleDiscount, moduleValueInputRefs.current[discount.id])}

          {/* Facility based price */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Facility based price
          </Typography>
          <Box sx={{ mb: 3 }}>
            {discount.facilityPrices.map((facilityPrice) => (
              <Box
                key={facilityPrice.id}
                sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}
              >
                <FormControl sx={{ flex: 1 }} size="small">
                  <InputLabel>Facility</InputLabel>
                  <Select
                    label="Facility"
                    value={facilityPrice.facility}
                    onChange={(e) =>
                      updateModuleFacilityPrice(
                        discount.id,
                        facilityPrice.id,
                        'facility',
                        e.target.value
                      )
                    }
                  >
                    {facilities.map((facility) => (
                      <MenuItem key={facility} value={facility}>
                        {facility}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Value"
                  type="number"
                  value={facilityPrice.value}
                  onChange={(e) =>
                    updateModuleFacilityPrice(discount.id, facilityPrice.id, 'value', e.target.value)
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <IconButton
                  size="small"
                  onClick={() => deleteModuleFacilityPrice(discount.id, facilityPrice.id)}
                  sx={{ color: 'error.main', mt: 0.5 }}
                >
                  <DeleteRounded />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={() => addModuleFacilityPrice(discount.id)}
              sx={{ textTransform: 'none' }}
            >
              Add facility substitute based price
            </Button>
          </Box>
          </CollapsibleBlock>
        );
      })}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={addModuleDiscount}
          sx={{ textTransform: 'none' }}
        >
          Add a module discount
        </Button>
      </Box>
    </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '1px solid #B0BEC5',
        },
      }}
    >
      <DialogTitle sx={{ p: 3, borderBottom: '1px solid #B0BEC5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create Discount Campaign
          </Typography>
          <IconButton
            onClick={onCancel}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseRounded />
          </IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ display: 'flex', minHeight: 500 }}>
        <Box
          sx={{
            width: 280,
            borderRight: '1px solid #B0BEC5',
            backgroundColor: '#F9F9F9',
            p: 3,
          }}
        >
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                left: 0,
                right: 'auto',
                width: 3,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                minHeight: 48,
                fontWeight: 400,
                fontSize: 14,
                color: 'text.secondary',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                px: 2,
                py: 1.5,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 500,
                  backgroundColor: 'rgba(22, 108, 184, 0.08)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(22, 108, 184, 0.04)',
                },
              },
            }}
          >
            <Tab
              icon={<SettingsRounded sx={{ fontSize: 20, mr: 1 }} />}
              iconPosition="start"
              label="Basic Info"
            />
            <Tab
              icon={<CardMembershipRounded sx={{ fontSize: 20, mr: 1 }} />}
              iconPosition="start"
              label="Membership Fees"
            />
            <Tab
              icon={<AttachMoneyRounded sx={{ fontSize: 20, mr: 1 }} />}
              iconPosition="start"
              label="Flat Fees"
            />
            <Tab
              icon={<ExtensionRounded sx={{ fontSize: 20, mr: 1 }} />}
              iconPosition="start"
              label="Modules"
            />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {activeTab === 0 && renderBasicInfo()}
          {activeTab === 1 && renderMembershipFeeDiscounts()}
          {activeTab === 2 && renderFlatFeeDiscounts()}
          {activeTab === 3 && renderModuleDiscounts()}
        </Box>
      </Box>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #B0BEC5' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ textTransform: 'none' }}
        >
          {saving ? 'Saving...' : 'Save campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

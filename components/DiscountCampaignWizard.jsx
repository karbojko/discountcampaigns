import React, { useState } from 'react';
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
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import CardMembershipRounded from '@mui/icons-material/CardMembershipRounded';
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded';
import ExtensionRounded from '@mui/icons-material/ExtensionRounded';
import TranslateRounded from '@mui/icons-material/TranslateRounded';

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

  // Voucher Logic - Stacking Rules
  const [voucherStackingLogic, setVoucherStackingLogic] = useState('allow_additionally');

  // Voucher Logic - Priority
  const [voucherPriority, setVoucherPriority] = useState('vouchers_first');

  // Source
  const [sources, setSources] = useState([]);

  // Membership Fee Discounts
  const [membershipDiscounts, setMembershipDiscounts] = useState([]);

  // Flat Fee Discounts
  const [flatFeeDiscounts, setFlatFeeDiscounts] = useState([]);

  // Module Discounts
  const [moduleDiscounts, setModuleDiscounts] = useState([]);

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
    // Validate required fields
    if (!internalName.trim() || !publicName.trim() || !startDate) {
      setActiveTab(0); // Switch to Basic Info tab
      alert('Please fill in all required fields: Internal name, Public name, and Start date');
      return;
    }
    
    // Validate end date is not before start date
    if (endDate && new Date(endDate) < new Date(startDate)) {
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
        discountPeriod: endDate ? `${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}` : `${new Date(startDate).toLocaleDateString('de-DE')} - Ongoing`,
        combinationWithVouchers: voucherStackingLogic === 'allow_additionally',
        description: publicDescription || '',
        membershipDiscounts: membershipDiscounts.map(d => ({
          id: `m${d.id}`,
          membershipOffer: d.membershipOfferId || 'All',
          terms: d.termMode === 'all_terms' ? 'All' : d.selectedTerms.join(', '),
          paymentFrequency: d.frequencyMode === 'all_frequencies' ? 'All' : d.selectedFrequencies.join(', '),
          discountType: d.discountType.replace('_', ' '),
          value: d.discountType === 'percentage' ? Number(d.value) : d.value,
          ...(d.starterPackageEnabled && d.starterPackageValue && {
            starterPackageDiscount: Number(d.starterPackageValue)
          }),
          ...(d.facilityPrices.length > 0 && {
            facilityPrices: d.facilityPrices.map(fp => ({
              facility: fp.facility,
              price: `${fp.value} €`
            }))
          })
        })),
        flatFeeDiscounts: flatFeeDiscounts.map(d => ({
          id: `f${d.id}`,
          flatFeeType: d.flatFeeType.replace('_', ' '),
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
          moduleName: d.moduleType.replace('_', ' '),
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
    setMembershipDiscounts([
      ...membershipDiscounts,
      {
        id: Date.now(),
        membershipOfferMode: 'all',
        membershipOfferId: null,
        termMode: 'all_terms',
        selectedTerms: [],
        frequencyMode: 'all_frequencies',
        selectedFrequencies: [],
        durationType: 'permanent',
        durationMonths: '',
        durationMinimum: '',
        discountType: 'percentage',
        value: '',
        facilityPrices: [],
        starterPackageEnabled: false,
        starterPackageType: 'percentage',
        starterPackageValue: '',
      },
    ]);
  };

  const updateMembershipDiscount = (id, field, value) => {
    setMembershipDiscounts(
      membershipDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
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

  const addFlatFeeDiscount = () => {
    setFlatFeeDiscounts([
      ...flatFeeDiscounts,
      {
        id: Date.now(),
        membershipOfferMode: 'all',
        membershipOfferId: null,
        termMode: 'all_terms',
        selectedTerms: [],
        frequencyMode: 'all_frequencies',
        selectedFrequencies: [],
        flatFeeType: 'one_time',
        durationType: 'permanent',
        durationMonths: '',
        durationMinimum: '',
        discountType: 'percentage',
        value: '',
        facilityPrices: [],
      },
    ]);
  };

  const updateFlatFeeDiscount = (id, field, value) => {
    setFlatFeeDiscounts(
      flatFeeDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
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
    setModuleDiscounts([
      ...moduleDiscounts,
      {
        id: Date.now(),
        membershipOfferMode: 'all',
        membershipOfferId: null,
        termMode: 'all_terms',
        selectedTerms: [],
        frequencyMode: 'all_frequencies',
        selectedFrequencies: [],
        moduleType: 'one_time',
        durationType: 'permanent',
        durationMonths: '',
        durationMinimum: '',
        discountType: 'percentage',
        value: '',
        facilityPrices: [],
      },
    ]);
  };

  const updateModuleDiscount = (id, field, value) => {
    setModuleDiscounts(
      moduleDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d))
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
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Start date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          sx={{ flex: 1 }}
        />
        <TextField
          label="End date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          sx={{ flex: 1 }}
          inputProps={{ min: startDate }}
          error={endDate && startDate && new Date(endDate) < new Date(startDate)}
          helperText={endDate && startDate && new Date(endDate) < new Date(startDate) ? 'End date must not be earlier than start date' : ''}
        />
      </Box>

      {/* Voucher Logic - Stacking Rules Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Voucher logic – stacking rules
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
          Voucher logic
        </FormLabel>
        <RadioGroup
          value={voucherStackingLogic}
          onChange={(e) => setVoucherStackingLogic(e.target.value)}
        >
          <FormControlLabel
            value="allow_additionally"
            control={<Radio />}
            label={<Typography variant="body2">Allow vouchers additionally</Typography>}
          />
          <FormControlLabel
            value="replace_discount"
            control={<Radio />}
            label={<Typography variant="body2">Vouchers replace inherent discount</Typography>}
          />
          <FormControlLabel
            value="disallow"
            control={<Radio />}
            label={<Typography variant="body2">Disallow vouchers</Typography>}
          />
        </RadioGroup>
      </FormControl>

      {/* Voucher Logic - Priority Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Voucher logic – priority
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
          Voucher type priority
        </FormLabel>
        <RadioGroup
          value={voucherPriority}
          onChange={(e) => setVoucherPriority(e.target.value)}
        >
          <FormControlLabel
            value="vouchers_first"
            control={<Radio />}
            label={<Typography variant="body2">Vouchers first</Typography>}
          />
          <FormControlLabel
            value="discounts_first"
            control={<Radio />}
            label={<Typography variant="body2">Discount campaigns first</Typography>}
          />
        </RadioGroup>
      </FormControl>

      {/* Source Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Source
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel>Source</InputLabel>
        <Select
          multiple
          value={sources}
          onChange={handleSourceChange}
          input={<OutlinedInput label="Source" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {sourceOptions.map((source) => (
            <MenuItem key={source} value={source}>
              <Checkbox checked={sources.indexOf(source) > -1} />
              <Typography variant="body2">{source}</Typography>
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Enable discount for the following sources (multiselect)</FormHelperText>
      </FormControl>
    </Box>
  );

  const renderMembershipFeeDiscounts = () => (
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

      {membershipDiscounts.map((discount, index) => (
        <Paper
          key={discount.id}
          sx={{ p: 3, mb: 3, border: '1px solid #B0BEC5', boxShadow: 'none', borderRadius: 2 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Membership Fee Discount {index + 1}
            </Typography>
            <IconButton
              size="small"
              onClick={() => deleteMembershipDiscount(discount.id)}
              sx={{ color: 'error.main' }}
            >
              <DeleteRounded />
            </IconButton>
          </Box>

          {/* Select membership offer */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Select membership offer
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.membershipOfferMode}
              onChange={(e) => {
                const newMode = e.target.value;
                updateMembershipDiscount(discount.id, 'membershipOfferMode', newMode);
                if (newMode === 'all') {
                  updateMembershipDiscount(discount.id, 'membershipOfferId', null);
                }
              }}
            >
              <FormControlLabel
                value="single"
                control={<Radio />}
                label={<Typography variant="body2">Membership offer</Typography>}
              />
              {discount.membershipOfferMode === 'single' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select offer</InputLabel>
                    <Select
                      value={discount.membershipOfferId || ''}
                      onChange={(e) =>
                        updateMembershipDiscount(discount.id, 'membershipOfferId', e.target.value)
                      }
                      label="Select offer"
                    >
                      {membershipOffers.map((offer) => (
                        <MenuItem key={offer} value={offer}>
                          <Typography variant="body2">{offer}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <FormControlLabel
                value="all"
                control={<Radio />}
                label={<Typography variant="body2">All offers</Typography>}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              If 'All offers' is selected, then all payment frequencies and terms are selected automatically.
            </FormHelperText>
          </FormControl>

          {/* Term */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Term
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.termMode}
              onChange={(e) => updateMembershipDiscount(discount.id, 'termMode', e.target.value)}
            >
              <FormControlLabel
                value="if_term"
                control={<Radio />}
                label={<Typography variant="body2">If term</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
              {discount.termMode === 'if_term' && discount.membershipOfferMode !== 'all' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select terms</InputLabel>
                    <Select
                      multiple
                      value={discount.selectedTerms}
                      onChange={(e) =>
                        updateMembershipDiscount(discount.id, 'selectedTerms', e.target.value)
                      }
                      input={<OutlinedInput label="Select terms" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {terms.map((term) => (
                        <MenuItem key={term} value={term}>
                          <Checkbox checked={discount.selectedTerms.indexOf(term) > -1} />
                          <Typography variant="body2">{term}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <FormControlLabel
                value="all_terms"
                control={<Radio />}
                label={<Typography variant="body2">All terms</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              Related only to selected membership offer
            </FormHelperText>
          </FormControl>

          {/* Payment frequency */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Payment frequency
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.frequencyMode}
              onChange={(e) =>
                updateMembershipDiscount(discount.id, 'frequencyMode', e.target.value)
              }
            >
              <FormControlLabel
                value="payment_frequency"
                control={<Radio />}
                label={<Typography variant="body2">Payment frequency</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
              {discount.frequencyMode === 'payment_frequency' &&
                discount.membershipOfferMode !== 'all' && (
                  <Box sx={{ ml: 4, mb: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select frequencies</InputLabel>
                      <Select
                        multiple
                        value={discount.selectedFrequencies}
                        onChange={(e) =>
                          updateMembershipDiscount(
                            discount.id,
                            'selectedFrequencies',
                            e.target.value
                          )
                        }
                        input={<OutlinedInput label="Select frequencies" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {paymentFrequencies.map((freq) => (
                          <MenuItem key={freq} value={freq}>
                            <Checkbox
                              checked={discount.selectedFrequencies.indexOf(freq) > -1}
                            />
                            <Typography variant="body2">{freq}</Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              <FormControlLabel
                value="all_frequencies"
                control={<Radio />}
                label={<Typography variant="body2">All payment frequencies</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              Related only to selected membership offer
            </FormHelperText>
          </FormControl>

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
              <FormControlLabel
                value="months"
                control={<Radio />}
                label={<Typography variant="body2">Months</Typography>}
              />
              {discount.durationType === 'months' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMonths}
                    onChange={(e) =>
                      updateMembershipDiscount(discount.id, 'durationMonths', e.target.value)
                    }
                    size="small"
                    sx={{ width: 200 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1 }}
                  />
                </Box>
              )}
              <FormControlLabel
                value="permanent"
                control={<Radio />}
                label={<Typography variant="body2">Permanent</Typography>}
              />
              <FormControlLabel
                value="minimum_duration"
                control={<Radio />}
                label={<Typography variant="body2">Minimum duration</Typography>}
              />
              {discount.durationType === 'minimum_duration' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMinimum}
                    onChange={(e) =>
                      updateMembershipDiscount(discount.id, 'durationMinimum', e.target.value)
                    }
                    size="small"
                    sx={{ width: 200 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1 }}
                  />
                </Box>
              )}
            </RadioGroup>
          </FormControl>

          {/* Type */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Type
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.discountType}
              onChange={(e) =>
                updateMembershipDiscount(discount.id, 'discountType', e.target.value)
              }
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

          {/* Value */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Value
          </Typography>
          <TextField
            label="Value"
            type="number"
            value={discount.value}
            onChange={(e) => updateMembershipDiscount(discount.id, 'value', e.target.value)}
            size="small"
            sx={{ mb: 3, width: 200 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 0, step: discount.discountType === 'percentage' ? 1 : 0.01 }}
          />

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

          {/* Discount starter package */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Discount starter package
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <RadioGroup
              value={discount.starterPackageEnabled ? 'on' : 'off'}
              onChange={(e) =>
                updateMembershipDiscount(
                  discount.id,
                  'starterPackageEnabled',
                  e.target.value === 'on'
                )
              }
            >
              <FormControlLabel
                value="off"
                control={<Radio />}
                label={<Typography variant="body2">Off</Typography>}
              />
              <FormControlLabel
                value="on"
                control={<Radio />}
                label={<Typography variant="body2">On</Typography>}
              />
            </RadioGroup>
          </FormControl>

          {discount.starterPackageEnabled && (
            <Box sx={{ ml: 4, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                Type
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <RadioGroup
                  value={discount.starterPackageType}
                  onChange={(e) =>
                    updateMembershipDiscount(discount.id, 'starterPackageType', e.target.value)
                  }
                >
                  <FormControlLabel
                    value="percentage"
                    control={<Radio />}
                    label={<Typography variant="body2">Percentage</Typography>}
                  />
                  <FormControlLabel
                    value="substitute_price"
                    control={<Radio />}
                    label={<Typography variant="body2">Substitute price</Typography>}
                  />
                  <FormControlLabel
                    value="absolute_discount"
                    control={<Radio />}
                    label={<Typography variant="body2">Absolute discount</Typography>}
                  />
                </RadioGroup>
              </FormControl>

              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
                Value
              </Typography>
              <TextField
                label="Value"
                type="number"
                value={discount.starterPackageValue}
                onChange={(e) =>
                  updateMembershipDiscount(discount.id, 'starterPackageValue', e.target.value)
                }
                size="small"
                sx={{ width: 200 }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: 0,
                  step: discount.starterPackageType === 'percentage' ? 1 : 0.01,
                }}
              />
            </Box>
          )}
        </Paper>
      ))}

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

  const renderFlatFeeDiscounts = () => (
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

      {flatFeeDiscounts.map((discount, index) => (
        <Paper
          key={discount.id}
          sx={{ p: 3, mb: 3, border: '1px solid #B0BEC5', boxShadow: 'none', borderRadius: 2 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Flat Fee Discount {index + 1}
            </Typography>
            <IconButton
              size="small"
              onClick={() => deleteFlatFeeDiscount(discount.id)}
              sx={{ color: 'error.main' }}
            >
              <DeleteRounded />
            </IconButton>
          </Box>

          {/* Select membership offer */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Select membership offer
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.membershipOfferMode}
              onChange={(e) => {
                const newMode = e.target.value;
                updateFlatFeeDiscount(discount.id, 'membershipOfferMode', newMode);
                if (newMode === 'all') {
                  updateFlatFeeDiscount(discount.id, 'membershipOfferId', null);
                }
              }}
            >
              <FormControlLabel
                value="single"
                control={<Radio />}
                label={<Typography variant="body2">Membership offer</Typography>}
              />
              {discount.membershipOfferMode === 'single' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select offer</InputLabel>
                    <Select
                      value={discount.membershipOfferId || ''}
                      onChange={(e) =>
                        updateFlatFeeDiscount(discount.id, 'membershipOfferId', e.target.value)
                      }
                      label="Select offer"
                    >
                      {membershipOffers.map((offer) => (
                        <MenuItem key={offer} value={offer}>
                          <Typography variant="body2">{offer}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <FormControlLabel
                value="all"
                control={<Radio />}
                label={<Typography variant="body2">All offers</Typography>}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              If 'All offers' is selected, then all payment frequencies and terms are selected automatically.
            </FormHelperText>
          </FormControl>

          {/* Term */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Term
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.termMode}
              onChange={(e) => updateFlatFeeDiscount(discount.id, 'termMode', e.target.value)}
            >
              <FormControlLabel
                value="if_term"
                control={<Radio />}
                label={<Typography variant="body2">If term</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
              {discount.termMode === 'if_term' && discount.membershipOfferMode !== 'all' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select terms</InputLabel>
                    <Select
                      multiple
                      value={discount.selectedTerms}
                      onChange={(e) =>
                        updateFlatFeeDiscount(discount.id, 'selectedTerms', e.target.value)
                      }
                      input={<OutlinedInput label="Select terms" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {terms.map((term) => (
                        <MenuItem key={term} value={term}>
                          <Checkbox checked={discount.selectedTerms.indexOf(term) > -1} />
                          <Typography variant="body2">{term}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <FormControlLabel
                value="all_terms"
                control={<Radio />}
                label={<Typography variant="body2">All terms</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              Related only to selected membership offer
            </FormHelperText>
          </FormControl>

          {/* Payment frequency */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Payment frequency
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.frequencyMode}
              onChange={(e) =>
                updateFlatFeeDiscount(discount.id, 'frequencyMode', e.target.value)
              }
            >
              <FormControlLabel
                value="payment_frequency"
                control={<Radio />}
                label={<Typography variant="body2">Payment frequency</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
              {discount.frequencyMode === 'payment_frequency' &&
                discount.membershipOfferMode !== 'all' && (
                  <Box sx={{ ml: 4, mb: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select frequencies</InputLabel>
                      <Select
                        multiple
                        value={discount.selectedFrequencies}
                        onChange={(e) =>
                          updateFlatFeeDiscount(
                            discount.id,
                            'selectedFrequencies',
                            e.target.value
                          )
                        }
                        input={<OutlinedInput label="Select frequencies" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {paymentFrequencies.map((freq) => (
                          <MenuItem key={freq} value={freq}>
                            <Checkbox
                              checked={discount.selectedFrequencies.indexOf(freq) > -1}
                            />
                            <Typography variant="body2">{freq}</Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              <FormControlLabel
                value="all_frequencies"
                control={<Radio />}
                label={<Typography variant="body2">All payment frequencies</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              Related only to selected membership offer
            </FormHelperText>
          </FormControl>

          {/* Flat fee */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Flat fee
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.flatFeeType}
              onChange={(e) =>
                updateFlatFeeDiscount(discount.id, 'flatFeeType', e.target.value)
              }
            >
              <FormControlLabel
                value="one_time"
                control={<Radio />}
                label={<Typography variant="body2">One time</Typography>}
              />
              <FormControlLabel
                value="another_one"
                control={<Radio />}
                label={<Typography variant="body2">Another one</Typography>}
              />
            </RadioGroup>
          </FormControl>

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
              <FormControlLabel
                value="months"
                control={<Radio />}
                label={<Typography variant="body2">Months</Typography>}
              />
              {discount.durationType === 'months' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMonths}
                    onChange={(e) =>
                      updateFlatFeeDiscount(discount.id, 'durationMonths', e.target.value)
                    }
                    size="small"
                    sx={{ width: 200 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1 }}
                  />
                </Box>
              )}
              <FormControlLabel
                value="permanent"
                control={<Radio />}
                label={<Typography variant="body2">Permanent</Typography>}
              />
              <FormControlLabel
                value="minimum_duration"
                control={<Radio />}
                label={<Typography variant="body2">Minimum duration</Typography>}
              />
              {discount.durationType === 'minimum_duration' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMinimum}
                    onChange={(e) =>
                      updateFlatFeeDiscount(discount.id, 'durationMinimum', e.target.value)
                    }
                    size="small"
                    sx={{ width: 200 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1 }}
                  />
                </Box>
              )}
            </RadioGroup>
          </FormControl>

          {/* Type */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Type
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.discountType}
              onChange={(e) =>
                updateFlatFeeDiscount(discount.id, 'discountType', e.target.value)
              }
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

          {/* Value */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Value
          </Typography>
          <TextField
            label="Value"
            type="number"
            value={discount.value}
            onChange={(e) => updateFlatFeeDiscount(discount.id, 'value', e.target.value)}
            size="small"
            sx={{ mb: 3, width: 200 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 0, step: discount.discountType === 'percentage' ? 1 : 0.01 }}
          />

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
        </Paper>
      ))}

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

  const renderModuleDiscounts = () => (
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

      {moduleDiscounts.map((discount, index) => (
        <Paper
          key={discount.id}
          sx={{ p: 3, mb: 3, border: '1px solid #B0BEC5', boxShadow: 'none', borderRadius: 2 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Additional Modules Discount {index + 1}
            </Typography>
            <IconButton
              size="small"
              onClick={() => deleteModuleDiscount(discount.id)}
              sx={{ color: 'error.main' }}
            >
              <DeleteRounded />
            </IconButton>
          </Box>

          {/* Select membership offer */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Select membership offer
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.membershipOfferMode}
              onChange={(e) => {
                const newMode = e.target.value;
                updateModuleDiscount(discount.id, 'membershipOfferMode', newMode);
                if (newMode === 'all') {
                  updateModuleDiscount(discount.id, 'membershipOfferId', null);
                }
              }}
            >
              <FormControlLabel
                value="single"
                control={<Radio />}
                label={<Typography variant="body2">Membership offer</Typography>}
              />
              {discount.membershipOfferMode === 'single' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select offer</InputLabel>
                    <Select
                      value={discount.membershipOfferId || ''}
                      onChange={(e) =>
                        updateModuleDiscount(discount.id, 'membershipOfferId', e.target.value)
                      }
                      label="Select offer"
                    >
                      {membershipOffers.map((offer) => (
                        <MenuItem key={offer} value={offer}>
                          <Typography variant="body2">{offer}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <FormControlLabel
                value="all"
                control={<Radio />}
                label={<Typography variant="body2">All offers</Typography>}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              If 'All offers' is selected, then all payment frequencies and terms are selected automatically.
            </FormHelperText>
          </FormControl>

          {/* Term */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Term
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.termMode}
              onChange={(e) => updateModuleDiscount(discount.id, 'termMode', e.target.value)}
            >
              <FormControlLabel
                value="if_term"
                control={<Radio />}
                label={<Typography variant="body2">If term</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
              {discount.termMode === 'if_term' && discount.membershipOfferMode !== 'all' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select terms</InputLabel>
                    <Select
                      multiple
                      value={discount.selectedTerms}
                      onChange={(e) =>
                        updateModuleDiscount(discount.id, 'selectedTerms', e.target.value)
                      }
                      input={<OutlinedInput label="Select terms" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {terms.map((term) => (
                        <MenuItem key={term} value={term}>
                          <Checkbox checked={discount.selectedTerms.indexOf(term) > -1} />
                          <Typography variant="body2">{term}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <FormControlLabel
                value="all_terms"
                control={<Radio />}
                label={<Typography variant="body2">All terms</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              Related only to selected membership offer
            </FormHelperText>
          </FormControl>

          {/* Payment frequency */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Payment frequency
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.frequencyMode}
              onChange={(e) =>
                updateModuleDiscount(discount.id, 'frequencyMode', e.target.value)
              }
            >
              <FormControlLabel
                value="payment_frequency"
                control={<Radio />}
                label={<Typography variant="body2">Payment frequency</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
              {discount.frequencyMode === 'payment_frequency' &&
                discount.membershipOfferMode !== 'all' && (
                  <Box sx={{ ml: 4, mb: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select frequencies</InputLabel>
                      <Select
                        multiple
                        value={discount.selectedFrequencies}
                        onChange={(e) =>
                          updateModuleDiscount(
                            discount.id,
                            'selectedFrequencies',
                            e.target.value
                          )
                        }
                        input={<OutlinedInput label="Select frequencies" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {paymentFrequencies.map((freq) => (
                          <MenuItem key={freq} value={freq}>
                            <Checkbox
                              checked={discount.selectedFrequencies.indexOf(freq) > -1}
                            />
                            <Typography variant="body2">{freq}</Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              <FormControlLabel
                value="all_frequencies"
                control={<Radio />}
                label={<Typography variant="body2">All payment frequencies</Typography>}
                disabled={discount.membershipOfferMode === 'all'}
              />
            </RadioGroup>
            <FormHelperText sx={{ ml: 0, color: 'text.secondary' }}>
              Related only to selected membership offer
            </FormHelperText>
          </FormControl>

          {/* Additional modules */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Additional modules
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.moduleType}
              onChange={(e) =>
                updateModuleDiscount(discount.id, 'moduleType', e.target.value)
              }
            >
              <FormControlLabel
                value="one_time"
                control={<Radio />}
                label={<Typography variant="body2">One time</Typography>}
              />
              <FormControlLabel
                value="another_one"
                control={<Radio />}
                label={<Typography variant="body2">Another one</Typography>}
              />
            </RadioGroup>
          </FormControl>

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
              <FormControlLabel
                value="months"
                control={<Radio />}
                label={<Typography variant="body2">Months</Typography>}
              />
              {discount.durationType === 'months' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMonths}
                    onChange={(e) =>
                      updateModuleDiscount(discount.id, 'durationMonths', e.target.value)
                    }
                    size="small"
                    sx={{ width: 200 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1 }}
                  />
                </Box>
              )}
              <FormControlLabel
                value="permanent"
                control={<Radio />}
                label={<Typography variant="body2">Permanent</Typography>}
              />
              <FormControlLabel
                value="minimum_duration"
                control={<Radio />}
                label={<Typography variant="body2">Minimum duration</Typography>}
              />
              {discount.durationType === 'minimum_duration' && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <TextField
                    label="Number"
                    type="number"
                    value={discount.durationMinimum}
                    onChange={(e) =>
                      updateModuleDiscount(discount.id, 'durationMinimum', e.target.value)
                    }
                    size="small"
                    sx={{ width: 200 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: 1 }}
                  />
                </Box>
              )}
            </RadioGroup>
          </FormControl>

          {/* Type */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Type
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <RadioGroup
              value={discount.discountType}
              onChange={(e) =>
                updateModuleDiscount(discount.id, 'discountType', e.target.value)
              }
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

          {/* Value */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Value
          </Typography>
          <TextField
            label="Value"
            type="number"
            value={discount.value}
            onChange={(e) => updateModuleDiscount(discount.id, 'value', e.target.value)}
            size="small"
            sx={{ mb: 3, width: 200 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 0, step: discount.discountType === 'percentage' ? 1 : 0.01 }}
          />

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
        </Paper>
      ))}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={addModuleDiscount}
          sx={{ textTransform: 'none' }}
        >
          Add a flat fee discount
        </Button>
      </Box>
    </Box>
  );

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

// Utility function to build summary text for discount blocks

export const buildMembershipDiscountSummary = (discount) => {
  const parts = [];
  
  // Helper to normalize values to arrays
  const normalizeToArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };
  
  // Helper to check if all items are selected
  const isAllSelected = (values, allOptions) => {
    if (!values || values.length === 0) return true;
    if (values.includes('All') || values[0] === 'All') return true;
    return allOptions && values.length === allOptions.length;
  };
  
  // Available options for comparison
  const allTerms = ['1 month', '3 months', '6 months', '12 months', '24 months'];
  const allFrequencies = ['Monthly', 'Quarterly', 'Semi-annually', 'Annually'];
  
  // 1. Membership offers
  const offers = normalizeToArray(discount.membershipOffer || discount.membershipOfferId);
  const offerLabels = offers.filter(o => o && o !== 'All');
  if (offerLabels.length > 0) {
    parts.push(offerLabels.join(', '));
  }
  
  // 2. Terms
  const terms = normalizeToArray(discount.term || discount.selectedTerm);
  if (isAllSelected(terms, allTerms)) {
    parts.push('All terms');
  } else {
    const termLabels = terms.filter(t => t && t !== 'All');
    if (termLabels.length > 0) {
      parts.push(termLabels.join(', '));
    }
  }
  
  // 3. Payment frequencies
  const frequencies = normalizeToArray(discount.paymentFrequency || discount.selectedFrequency);
  if (isAllSelected(frequencies, allFrequencies)) {
    parts.push('All frequencies');
  } else {
    const frequencyLabels = frequencies.filter(f => f && f !== 'All');
    if (frequencyLabels.length > 0) {
      parts.push(frequencyLabels.join(', '));
    }
  }
  
  // 4. Duration
  if (discount.durationType === 'permanent') {
    parts.push('Permanent');
  } else if (discount.durationType === 'minimum_duration') {
    parts.push('Min. duration');
  } else if (discount.durationType === 'months' && discount.durationMonths) {
    parts.push(`${discount.durationMonths} month${discount.durationMonths > 1 ? 's' : ''}`);
  }
  
  // 5. Discount type and value
  if (discount.discountType && discount.value) {
    if (discount.discountType === 'percentage') {
      parts.push(`${discount.value}% off`);
    } else if (discount.discountType === 'substitute_price') {
      parts.push(`New price: ${discount.value}€`);
    } else if (discount.discountType === 'absolute_price') {
      parts.push(`-${discount.value}€`);
    }
  }
  
  // 6. Facility overrides
  if (discount.facilityPrices && discount.facilityPrices.length > 0) {
    parts.push('Facility overrides');
  }
  
  // Default if empty
  if (parts.length === 0) {
    return 'Not configured';
  }
  
  // Join and truncate if needed
  const summary = parts.join(', ');
  return summary.length > 80 ? summary.substring(0, 77) + '...' : summary;
};

export const buildFlatFeeDiscountSummary = (discount) => {
  const parts = [];
  
  // Membership offer
  if (discount.membershipOfferId && discount.membershipOfferId !== 'All') {
    parts.push(discount.membershipOfferId);
  }
  
  // Term
  if (discount.selectedTerm && discount.selectedTerm !== 'All') {
    parts.push(discount.selectedTerm);
  }
  
  // Payment frequency
  if (discount.selectedFrequency && discount.selectedFrequency !== 'All') {
    parts.push(discount.selectedFrequency);
  }
  
  // Flat fee type
  if (discount.selectedFlatFee && discount.selectedFlatFee !== 'All') {
    parts.push(discount.selectedFlatFee);
  }
  
  // Duration
  if (discount.durationType === 'permanent') {
    parts.push('Permanent');
  } else if (discount.durationType === 'minimum_duration') {
    parts.push('Min. duration');
  } else if (discount.durationType === 'months' && discount.durationMonths) {
    parts.push(`${discount.durationMonths} month${discount.durationMonths > 1 ? 's' : ''}`);
  }
  
  // Discount type and value
  if (discount.discountType && discount.value) {
    if (discount.discountType === 'percentage') {
      parts.push(`${discount.value}% off`);
    } else if (discount.discountType === 'substitute_price') {
      parts.push(`New price: ${discount.value}€`);
    } else if (discount.discountType === 'absolute_price') {
      parts.push(`-${discount.value}€`);
    }
  }
  
  // Facility overrides
  if (discount.facilityPrices && discount.facilityPrices.length > 0) {
    parts.push('Facility overrides');
  }
  
  // Default if empty
  if (parts.length === 0) {
    return 'Not configured';
  }
  
  // Join and truncate if needed
  const summary = parts.join(', ');
  return summary.length > 80 ? summary.substring(0, 77) + '...' : summary;
};

export const buildModuleDiscountSummary = (discount) => {
  const parts = [];
  
  // Membership offer
  if (discount.membershipOfferId && discount.membershipOfferId !== 'All') {
    parts.push(discount.membershipOfferId);
  }
  
  // Term
  if (discount.selectedTerm && discount.selectedTerm !== 'All') {
    parts.push(discount.selectedTerm);
  }
  
  // Payment frequency
  if (discount.selectedFrequency && discount.selectedFrequency !== 'All') {
    parts.push(discount.selectedFrequency);
  }
  
  // Module type
  if (discount.selectedModule && discount.selectedModule !== 'All') {
    parts.push(discount.selectedModule);
  }
  
  // Duration
  if (discount.durationType === 'permanent') {
    parts.push('Permanent');
  } else if (discount.durationType === 'minimum_duration') {
    parts.push('Min. duration');
  } else if (discount.durationType === 'months' && discount.durationMonths) {
    parts.push(`${discount.durationMonths} month${discount.durationMonths > 1 ? 's' : ''}`);
  }
  
  // Discount type and value
  if (discount.discountType && discount.value) {
    if (discount.discountType === 'percentage') {
      parts.push(`${discount.value}% off`);
    } else if (discount.discountType === 'substitute_price') {
      parts.push(`New price: ${discount.value}€`);
    } else if (discount.discountType === 'absolute_price') {
      parts.push(`-${discount.value}€`);
    }
  }
  
  // Facility overrides
  if (discount.facilityPrices && discount.facilityPrices.length > 0) {
    parts.push('Facility overrides');
  }
  
  // Default if empty
  if (parts.length === 0) {
    return 'Not configured';
  }
  
  // Join and truncate if needed
  const summary = parts.join(', ');
  return summary.length > 80 ? summary.substring(0, 77) + '...' : summary;
};

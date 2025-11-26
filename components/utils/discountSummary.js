// Utility function to build summary text for discount blocks

export const buildMembershipDiscountSummary = (discount) => {
  const parts = [];
  
  // 1. Membership Offer - always display
  const membershipOffer = discount.membershipOffer || discount.membershipOfferId || 'All';
  parts.push(membershipOffer);
  
  // 2. Term - always display
  const term = discount.term || discount.selectedTerm || 'All';
  parts.push(term);
  
  // 3. Payment Frequency - always display
  const paymentFrequency = discount.paymentFrequency || discount.selectedFrequency || 'All';
  parts.push(paymentFrequency);
  
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

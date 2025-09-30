  const populateBillingLines = async (contractVuid) => {
    console.log('🔍 Debug: populateBillingLines called with contractVuid:', contractVuid);
    if (!contractVuid) {
      console.log('⚠️ Debug: No contract VUID provided');
      setCreateBillingLines([]);
      return;
    }

    // Fetch change order lines for the contract
    await fetchChangeOrderLines(contractVuid);

    const contract = projectContracts.find(c => c.vuid === contractVuid);
    if (!contract) {
      console.log('⚠️ Debug: Contract not found in projectContracts');
      setCreateBillingLines([]);
      return;
    }

    try {
      // Fetch contract items since they're not included in the main contracts API
      const itemsResponse = await fetch(`${baseURL}/api/project-contracts/${contractVuid}/items`);
      if (!itemsResponse.ok) {
        console.error('Failed to fetch contract items');
        return;
      }
      
      const contractItems = await itemsResponse.json();
      console.log(`🔍 Debug: Fetched ${contractItems.length} contract items`);
      
      if (!contractItems || contractItems.length === 0) {
        console.log('⚠️ Debug: No contract items found');
        setCreateBillingLines([]);
        return;
      }

      // Auto-populate customer from contract
      if (contract.customer_vuid) {
        setCreateFormData(prev => ({
          ...prev,
          customer_vuid: contract.customer_vuid
        }));
      }

      // Create billing lines from contract items
      const prefilledLines = contractItems.map((item, index) => ({
        line_number: item.item_number || (index + 1).toString(),
        description: item.description || '',
        cost_code_vuid: item.cost_code_vuid || '',
        cost_type_vuid: item.cost_type_vuid || '',
        contract_item_vuid: item.vuid,
        contract_amount: parseFloat(item.total_amount) || 0,
        billing_amount: 0,
        markup_percentage: 0,
        actual_billing_amount: 0,
        retainage_percentage: 10,
        retention_held: 0,
        retention_released: 0
      }));

      setCreateBillingLines(prefilledLines);
      await calculateBillingMetrics();
      
    } catch (error) {
      console.error('Error fetching contract items:', error);
      setCreateBillingLines([]);
    }
  };



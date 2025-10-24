class ProfitCalculations {
  // Revenue Calculations
  static calculateRevenue(orders) {
    return orders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0);
    }, 0);
  }

  static calculateCOGS(orders, productCosts) {
    let totalCOGS = 0;
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        const cost = productCosts[item.product_id] || 0;
        totalCOGS += cost * item.quantity;
      });
    });
    return totalCOGS;
  }

  // Profit Calculations
  static calculateGrossProfit(revenue, cogs) {
    return revenue - cogs;
  }

  static calculateGrossProfitMargin(grossProfit, revenue) {
    return revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  }

  static calculateNetProfit(grossProfit, adSpend, shippingCost) {
    return grossProfit - adSpend - shippingCost;
  }

  static calculateNetProfitMargin(netProfit, revenue) {
    return revenue > 0 ? (netProfit / revenue) * 100 : 0;
  }

  // Marketing Calculations
  static calculateROAS(revenue, adSpend) {
    return adSpend > 0 ? revenue / adSpend : 0;
  }

  static calculatePOAS(netProfit, adSpend) {
    return adSpend > 0 ? netProfit / adSpend : 0;
  }

  static calculateAOV(revenue, totalOrders) {
    return totalOrders > 0 ? revenue / totalOrders : 0;
  }

  static calculateCPP(adSpend, totalOrders) {
    return totalOrders > 0 ? adSpend / totalOrders : 0;
  }

  static calculateCPC(adSpend, clicks) {
    return clicks > 0 ? adSpend / clicks : 0;
  }

  static calculateCTR(clicks, impressions) {
    return impressions > 0 ? (clicks / impressions) * 100 : 0;
  }

  static calculateCPM(adSpend, impressions) {
    return impressions > 0 ? (adSpend / impressions) * 1000 : 0;
  }

  // Customer Calculations
  static analyzeCustomers(orders) {
    const customerOrders = {};
    
    orders.forEach(order => {
      const customerId = order.customer?.id;
      if (customerId) {
        if (!customerOrders[customerId]) {
          customerOrders[customerId] = [];
        }
        customerOrders[customerId].push(order.created_at);
      }
    });

    const newCustomers = Object.values(customerOrders).filter(dates => dates.length === 1).length;
    const returningCustomers = Object.values(customerOrders).filter(dates => dates.length > 1).length;
    const totalCustomers = Object.keys(customerOrders).length;
    const returningRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    return { newCustomers, returningCustomers, totalCustomers, returningRate };
  }

  // Shipping Calculations
  static analyzeShipments(shipments) {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status?.toLowerCase().includes('delivered')).length;
    const inTransit = shipments.filter(s => s.status?.toLowerCase().includes('in transit') || s.status?.toLowerCase().includes('in-transit')).length;
    const rto = shipments.filter(s => s.status?.toLowerCase().includes('rto')).length;
    const ndr = shipments.filter(s => s.status?.toLowerCase().includes('ndr')).length;
    
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    const rtoRate = total > 0 ? (rto / total) * 100 : 0;

    return { totalShipments: total, delivered, inTransit, rto, ndr, deliveryRate, rtoRate };
  }

  static calculateShippingCost(shipments) {
    return shipments.reduce((sum, shipment) => {
      const freight = parseFloat(shipment.charges?.freight_charges || 0);
      const cod = parseFloat(shipment.charges?.cod_charges || 0);
      const rto = parseFloat(shipment.charges?.rto_charges || 0);
      return sum + freight + cod + rto;
    }, 0);
  }
}

module.exports = ProfitCalculations;

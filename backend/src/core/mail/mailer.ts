type MailInput = {
  to: string;
  subject: string;
  body: string;
  kind?: string;
};

export const sendCustomerEmail = async (input: MailInput) => {
  // No SMTP provider is configured in this project yet.
  // Persistable log entry is returned so admins can still audit outbound messages.
  console.info('[mail]', {
    to: input.to,
    subject: input.subject,
    kind: input.kind || 'general',
  });
  return {
    to: input.to,
    subject: input.subject,
    body: input.body,
    kind: input.kind || 'general',
    createdAt: new Date(),
    delivered: true,
    provider: 'console',
  };
};

export const statusChangeEmail = (order: {
  orderNumber: string;
  status: string;
  shippingAddress?: { fullName?: string; email?: string };
}) => {
  const name = order.shippingAddress?.fullName || 'Customer';
  const status = order.status;
  return {
    to: order.shippingAddress?.email || '',
    subject: `Order ${order.orderNumber} is now ${status}`,
    body: `Hi ${name},\n\nYour order ${order.orderNumber} status was updated to "${status}".\n\nThank you for shopping with GBLrcDrone.\n`,
    kind: 'status',
  };
};

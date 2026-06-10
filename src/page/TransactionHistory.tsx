
import '../styles/TransactionHistory.css';

interface CashTx {
  _id: string;
  txType: 'received' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface TransactionHistoryProps {
  transactions: CashTx[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <div className="history-container">
      <div className="history-title-section">
        <h1 className="history-title">Complete Cashbook Log</h1>
        <p className="history-subtitle">Chronological list of all expenses and cash received entries.</p>
      </div>

      <div className="glass-panel">
        <div className="table-container" style={{ margin: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Details / Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                  <td>
                    <span className={`badge ${
                      tx.txType === 'received' ? 'badge-success' : 'badge-info'
                    }`}>
                      {tx.txType === 'received' ? 'RECEIVED' : tx.category.replace('-', ' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: tx.txType === 'received' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                    {tx.txType === 'received' ? '+' : '-'}₹{tx.amount}
                  </td>
                  <td>{tx.description}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

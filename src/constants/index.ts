import { format, subDays } from 'date-fns';
import { Transaction } from '../types';

export const INITIAL_TRANSACTIONS = (() => {
  const today = new Date();
  return [
    { id: '1', title: 'Gaji Bulanan', amount: 15000000, type: 'income', category: 'Salary', date: format(subDays(today, 5), 'yyyy-MM-dd'), time: '09:00', classification: 'personal' },
    { id: '2', title: 'Makan Siang', amount: 50000, type: 'expense', category: 'Food', date: format(subDays(today, 4), 'yyyy-MM-dd'), time: '12:30', classification: 'personal' },
    { id: '3', title: 'Netflix', amount: 186000, type: 'expense', category: 'Entertainment', date: format(subDays(today, 3), 'yyyy-MM-dd'), time: '20:00', classification: 'personal' },
    { id: '4', title: 'Bonus Project', amount: 2500000, type: 'income', category: 'Bonus', date: format(subDays(today, 2), 'yyyy-MM-dd'), time: '14:15', classification: 'business' },
    { id: '5', title: 'Belanja Bulanan', amount: 1200000, type: 'expense', category: 'Shopping', date: format(subDays(today, 1), 'yyyy-MM-dd'), time: '10:00', classification: 'personal' },
    { id: '6', title: 'Kopi Sore', amount: 35000, type: 'expense', category: 'Food', date: format(today, 'yyyy-MM-dd'), time: '16:45', classification: 'personal' },
  ] as Transaction[];
})();

// Demo data — the standalone PWA runs on this. Supabase wiring is a later task.
import type { Entry, Group, Loan, MealMember, Thing } from "./types";

export const seedGroups: Group[] = [
  {
    id: "roommates",
    name: "Roommates",
    members: [
      { name: "You", net: -240 },
      { name: "Jim", net: 300 },
      { name: "Paul", net: -60 },
      { name: "Rina", net: 0 },
    ],
  },
  {
    id: "trip",
    name: "Weekend Trip",
    members: [
      { name: "You", net: 167 },
      { name: "Sara", net: -100 },
      { name: "Tom", net: -67 },
    ],
  },
];

export const seedEntries: Entry[] = [
  { id: "e1", when: "Today", time: "1:20 PM", title: "Lunch", sub: "Personal", cat: "food", amount: 180, kind: "personal", note: "Kacchi at Sultan’s" },
  {
    id: "e2", when: "Today", time: "11:05 AM", title: "Groceries", sub: "Roommates · you paid ৳1,200", cat: "grocery", amount: 900, kind: "owed",
    total: 1200, paidBy: "You", group: "Roommates", parts: [{ name: "You", owed: 300 }, { name: "Jim", owed: 300 }, { name: "Paul", owed: 300 }, { name: "Rina", owed: 300 }], yourShare: 300,
  },
  {
    id: "e3", when: "Yesterday", time: "9:40 PM", title: "Dinner", sub: "Roommates · Jim paid · your share", cat: "food", amount: 240, kind: "share",
    total: 960, paidBy: "Jim", group: "Roommates", parts: [{ name: "You", owed: 240 }, { name: "Jim", owed: 240 }, { name: "Paul", owed: 240 }, { name: "Rina", owed: 240 }], yourShare: 240,
  },
  { id: "e4", when: "Yesterday", time: "8:15 AM", title: "Bus fare", sub: "Personal", cat: "transport", amount: 30, kind: "personal" },
  {
    id: "e5", when: "Earlier", time: "Sat", title: "Movie tickets", sub: "Weekend Trip · you paid ৳600", cat: "fun", amount: 400, kind: "owed",
    total: 600, paidBy: "You", group: "Weekend Trip", parts: [{ name: "You", owed: 200 }, { name: "Sara", owed: 200 }, { name: "Tom", owed: 200 }], yourShare: 200,
  },
  { id: "e6", when: "Earlier", time: "Fri", title: "Phone bill", sub: "Personal", cat: "bills", amount: 499, kind: "personal", note: "Monthly recharge" },
];

export const seedLoans: Loan[] = [
  { id: "l1", who: "Rina", dir: "lent", amount: 500, note: "cab to airport", due: "Fri" },
  { id: "l2", who: "Dad", dir: "borrowed", amount: 1000, note: "topped up bKash", due: null },
];

export const seedThings: Thing[] = [
  { id: "t1", what: "Phone charger", who: "Jim", dir: "lent", since: "3 days ago" },
  { id: "t2", what: "Power drill", who: "Tom", dir: "borrowed", since: "last week" },
  { id: "t3", what: "Rain umbrella", who: "Sara", dir: "lent", since: "yesterday" },
];

export const seedMealMembers: MealMember[] = [
  { name: "You", contributed: 1200, meals: 12 },
  { name: "Jim", contributed: 900, meals: 16 },
  { name: "Paul", contributed: 0, meals: 10 },
  { name: "Rina", contributed: 300, meals: 10 },
];

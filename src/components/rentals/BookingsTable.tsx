"use client";

import styles from "@/app/(dashboard)/rentals/bookings/styles";
import { BookingStatus } from "./StatusFilter";

interface Props {
  status: BookingStatus;
}

export default function BookingsTable({ status }: Props) {
  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Car</th>
            <th>Status</th>
            <th>Pickup</th>
            <th>Return</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>#RB1023</td>
            <td>John Doe</td>
            <td>Toyota Corolla</td>
            <td>
              <span style={styles.badgePending}>Pending</span>
            </td>
            <td>Aug 20</td>
            <td>Aug 24</td>
            <td>$240</td>
            <td>
              <button style={styles.actionBtn}>View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

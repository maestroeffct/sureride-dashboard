import { StatProps } from "@/src/types/types";
import styles from "./styles";

export default function StatCard({ title, value, change }: StatProps) {
  return (
    <div style={styles.card}>
      <p style={styles.title}>{title}</p>
      <h2 style={styles.value}>{value}</h2>
      <span style={styles.change}>{change} from last period</span>
    </div>
  );
}

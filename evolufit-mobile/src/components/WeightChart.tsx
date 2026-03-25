import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { LineChart } from 'react-native-chart-kit'

interface WeightLog {
  weight_kg: number
  measured_at: string
}

interface Props {
  data: WeightLog[]
}

const W = Dimensions.get('window').width - 48

export function WeightChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Registre ao menos 2 pesos para ver o gráfico</Text>
      </View>
    )
  }

  const sorted = [...data].sort((a, b) =>
    new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  ).slice(-10) // últimos 10 registros

  const labels = sorted.map((w) => {
    const d = new Date(w.measured_at)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })

  const weights = sorted.map((w) => Number(w.weight_kg))
  const minW = Math.floor(Math.min(...weights) - 1)
  const maxW = Math.ceil(Math.max(...weights) + 1)

  return (
    <View>
      <LineChart
        data={{ labels, datasets: [{ data: weights }] }}
        width={W}
        height={160}
        yAxisSuffix="kg"
        fromNumber={maxW}
        fromZero={false}
        chartConfig={{
          backgroundColor: '#1C1F2A',
          backgroundGradientFrom: '#1C1F2A',
          backgroundGradientTo: '#1C1F2A',
          decimalPlaces: 1,
          color: () => '#00E5A0',
          labelColor: () => '#666',
          propsForDots: { r: '4', strokeWidth: '2', stroke: '#00E5A0' },
          propsForBackgroundLines: { stroke: '#2A2D3A' },
        }}
        bezier
        style={{ borderRadius: 12, marginLeft: -8 }}
        withInnerLines={true}
        withOuterLines={false}
        segments={4}
      />
      <View style={styles.range}>
        <Text style={styles.rangeText}>Min: {Math.min(...weights).toFixed(1)}kg</Text>
        <Text style={styles.rangeText}>Max: {Math.max(...weights).toFixed(1)}kg</Text>
        <Text style={styles.rangeText}>
          Δ {(weights[weights.length - 1] - weights[0] >= 0 ? '+' : '')}{(weights[weights.length - 1] - weights[0]).toFixed(1)}kg
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 13 },
  range: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rangeText: { color: '#666', fontSize: 12 },
})

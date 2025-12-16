export interface ScripPriceData{
  timeStamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume:number;
}

export interface ChartDataPoint{
  time: number;
  value:number;
}
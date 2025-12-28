import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import RunningCalculator from './pages/RunningCalculator'
import WeightCalculator from './pages/WeightCalculator'
import PitchingCalculator from './pages/PitchingCalculator'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/running" replace />} />
          <Route path="running" element={<RunningCalculator />} />
          <Route path="weight" element={<WeightCalculator />} />
          <Route path="pitching" element={<PitchingCalculator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

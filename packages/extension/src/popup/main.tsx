import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { checkAndMigrate } from '../lib/migration'

// 检查并执行 v1.x -> v2.x 数据迁移
checkAndMigrate()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

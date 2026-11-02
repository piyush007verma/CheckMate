import { Component } from 'react'

// Catches render errors so one broken widget (e.g. the map) does not blank the whole page.
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) { console.error(err) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="empty card" role="alert">
        <h3>{this.props.title || 'Something went wrong'}</h3>
        <p className="muted">Please refresh the page and try again.</p>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>Refresh</button>
      </div>
    )
  }
}

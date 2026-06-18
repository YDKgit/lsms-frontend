import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace' }}>
          <h2>화면 오류</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>
            {this.state.error.stack || this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

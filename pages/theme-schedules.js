import {
  Button,
  Card,
  Form,
  FormLayout,
  Layout,
  Page,
  SettingToggle,
  Stack,
  TextField,
  TextStyle,
  DatePicker,
  Select, EmptyState
} from '@shopify/polaris';
var _ = require('lodash');

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

class ThemeSchedules extends React.Component {
  state = {
    scheduleList: {}
  };

  render() {

    return (
      <Page>
        <Layout>
          <EmptyState
            heading="Schedule changes to start"
            image={img}
          >
            <p>Use theme commands page to schedule new changes to your website.</p>
          </EmptyState>
        </Layout>
      </Page>
    );
  }

  handleChange = (field) => {
    return (value) => this.setState({ [field]: value });
  };

  handleSubmit = () => {

    console.log('submit state', this.state);

  };

}

export default ThemeSchedules;
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
    scheduleList: []
  };

  componentDidMount() {
    console.log("mount");

    const fetchURL = `/api/themes/schedules`;
    const options = {
      method: 'GET'
    };

    fetch(fetchURL, options)
      .then(response => response.json())
      .then(({themeSchedules}) => {
        console.log('mount themeSchedules', themeSchedules)

        this.setState({
          scheduleList: themeSchedules,
        });
      })
      .catch(error => alert(error));

  }

  render() {

    return (
      <Page>
        <Layout>
          {_.isEmpty(this.state.scheduleList) ?
            <EmptyState
              heading="Schedule changes to start"
              image={img}
            >
              <p>Use theme commands page to schedule new changes to your website. Return here to view your scheduled changes.</p>
            </EmptyState>
            :
            <div>
              {
                this.state.scheduleList.map(schedule => {
                  return (
                    <div key={schedule.id}>
                      <div>{schedule.description}</div>
                      <div>Scheduled For: {new Date(schedule.scheduleAt).toString()}</div>
                      <div>Deployed {schedule.deployed ? "Yes" : "No"}</div>
                    </div>
                  )
                })
              }
            </div>
          }

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
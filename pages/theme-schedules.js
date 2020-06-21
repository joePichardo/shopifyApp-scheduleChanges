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
  Select, EmptyState,
  ResourceList,
  ResourceItem,
  Pagination
} from '@shopify/polaris';
var _ = require('lodash');
var moment = require('moment');

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

class ThemeSchedules extends React.Component {
  state = {
    scheduleList: [],
    selectedItems: []
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

    const bulkActions = [
      {
        content: 'Delete schedules',
        onAction: () => this.deleteThemeSchedules(),
      },
    ];

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
            <Layout.Section>
              <Card>
                <ResourceList
                  resourceName={{singular: 'schedule', plural: 'schedules'}}
                  items={this.state.scheduleList}
                  bulkActions={bulkActions}
                  selectable
                  selectedItems={this.state.selectedItems}
                  onSelectionChange={this.setSelectedItems}
                  renderItem={(item) => {
                    const {id, description, scheduleAt, deployed, backupId} = item;

                    return (
                      <ResourceItem
                        id={id}
                        accessibilityLabel={`Scheduled change description: ${description}`}
                      >
                        <h3>
                          <TextStyle variation="strong">{moment(scheduleAt).format("LLLL").toString()}</TextStyle>
                        </h3>
                        <div>{description}</div>
                        <div>Deployed: {deployed ? "Yes" : "No"}</div>
                      </ResourceItem>
                    );
                  }}
                />
              </Card>
              <div style={{height: '100px', marginTop: '15px'}}>
                <Pagination
                  hasPrevious
                  previousKeys={[74]}
                  previousTooltip="j"
                  onPrevious={() => {
                    console.log('Previous');
                  }}
                  hasNext
                  nextKeys={[75]}
                  nextTooltip="k"
                  onNext={() => {
                    console.log('Next');
                  }}
                />
              </div>
            </Layout.Section>
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

  setSelectedItems = (items) => {
    console.log("selection changed", items)

    this.setState({
      selectedItems: items,
    });
  };

  deleteThemeSchedules = () => {
    console.log("deleteThemeSchedules")

    const { selectedItems, scheduleList } = this.state;

    for (var i = 0; i < selectedItems.length; i++) {
      console.log("delete schedule", selectedItems[i]);

      const data = {
        scheduleId: selectedItems[i]
      }


      const fetchURL = `/api/themes/schedule/delete`;
      const options = {
        method: 'POST',
        body: JSON.stringify(data)
      };

      fetch(fetchURL, options)
        .then(response => response.json())
        .then(json => {
          console.log("schedule delete response json", json)

          const newScheduleList = scheduleList.filter(schedule => schedule.id !== data.scheduleId);
          this.setState({ scheduleList: newScheduleList });

          return json;
        })
        .catch(error => alert(error));
    }

  }

}

export default ThemeSchedules;
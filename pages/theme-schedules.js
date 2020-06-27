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
  Pagination,
  Modal,
  TextContainer
} from '@shopify/polaris';
var _ = require('lodash');
var moment = require('moment');

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

class ThemeSchedules extends React.Component {
  state = {
    scheduleList: [],
    selectedItems: [],
    selectedItem: {},
    activeTheme: {},
    modalActive: false,
    modalContent: ""
  };

  componentDidMount() {

    const fetchURL = `/api/themes/schedules`;
    const options = {
      method: 'GET'
    };

    fetch(fetchURL, options)
      .then(response => response.json())
      .then(({themeSchedules}) => {

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
                        verticalAlignment={"center"}
                      >
                        <Stack alignment="center">
                          <Stack.Item fill>
                            <h3>
                              <TextStyle variation="strong">{moment(scheduleAt).format("LLLL").toString()}</TextStyle>
                            </h3>
                            <div>{description}</div>
                            <div>Deployed: {deployed ? "Yes" : "No"}</div>
                          </Stack.Item>
                          <Stack.Item>
                            <Button onClick={() => { this.handleModalChange("deploySchedule", item) }}>Deploy Now</Button>
                          </Stack.Item>
                          <Stack.Item>
                            <Button onClick={() => { this.handleModalChange("restoreBackup", item) }}>Restore Backup</Button>
                          </Stack.Item>
                          <Stack.Item>
                            <Button destructive={true} onClick={() => { this.handleModalChange("deleteSchedule", item) }}>Delete Schedule</Button>
                          </Stack.Item>
                        </Stack>
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

        <div style={{height: '500px'}}>
          <Modal
            open={this.state.modalActive}
            onClose={this.handleModalChange}
            title="Confirm Action"
            primaryAction={{
              content: 'Confirm',
              onAction: this.handleActionConfirmation
            }}
            secondaryActions={[
              {
                content: 'Cancel',
                onAction: this.handleModalChange
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <p>
                  {this.state.modalContent}
                </p>
              </TextContainer>
            </Modal.Section>
          </Modal>
        </div>
      </Page>
    );
  }

  handleChange = (field) => {
    return (value) => this.setState({ [field]: value });
  };

  handleSubmit = () => {

    console.log('submit state', this.state);

  };

  handleActionConfirmation = () => {

    const { selectedItem, selectedAction } = this.state;

    if (selectedAction === "restoreBackup") {
      this.shortcutRestoreBackup(selectedItem.backupId);
    }

    if (selectedAction === "deploySchedule") {
      this.shortcutDeploySchedule(selectedItem);
    }

    if (selectedAction === "deleteSchedule") {
      this.shortcutDeleteSchedule(selectedItem.id);
    }

    this.setState({ modalActive: !this.state.modalActive });

  };

  handleModalChange = (action, item) => {

    if (item) {
      this.setState({ selectedItem: item });
      this.setState({ selectedAction: action });
    }

    if (action === "restoreBackup") {
      this.setState({ modalContent: "Confirm that you want to restore to this backup." });
    }

    if (action === "deploySchedule") {
      this.setState({ modalContent: "Confirm that you want to deploy the scheduled change now." });
    }

    if (action === "deleteSchedule") {
      this.setState({ modalContent: "Confirm that you want to delete to this schedule." });
    }

    this.setState({ modalActive: !this.state.modalActive });
  }

  shortcutDeploySchedule = async (scheduleItem) => {

    const asset = {
      key: scheduleItem.fileKey,
      value: scheduleItem.fileValue
    }

    const response = await this.updateThemeFile(asset)
      .then(json => {

        this.setState({
          scheduleList: this.state.scheduleList.map(el => (el.id === scheduleItem.id ? {...el, deployed: true} : el))
        });

        return json;
      })
      .catch(error => alert(error));

  }

  shortcutDeleteSchedule = (scheduleId) => {
    const { scheduleList } = this.state;

    const data = {
      scheduleId: scheduleId
    }

    const fetchURL = `/api/themes/schedule/delete`;
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => {

        const newScheduleList = scheduleList.filter(schedule => schedule.id !== data.scheduleId);
        this.setState({ scheduleList: newScheduleList });

        return json;
      })
      .catch(error => alert(error));
  }

  getThemeList = () => {
    const fetchURL = `/api/themes`;
    const options = {
      method: 'GET'
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => alert(error));
  }

  findCurrentThemes = (json) => {
    if (json.data.themes !== undefined) {
      var themes = json.data.themes;
      themes.forEach((theme) => {
        if (theme.role === "main") {
          this.setState({
            activeTheme: theme,
          });
        }
      })
    }

    if(_.isEmpty(this.state.activeTheme)) {
      throw new Error('Did not find active theme');
    }

    return true;
  }

  shortcutRestoreBackup = async (backupId) => {

    const response = await this.getThemeList()
      .then(json => {
        return this.findCurrentThemes(json);
      }).then(themesFound => {

        if (!themesFound) {
          throw new Error('Did not find current themes');
        }

        return this.getBackupThemeFile(backupId);
      }).then(json => {
        const asset = {
          key: json.data.themeBackup.fileKey,
          value: json.data.themeBackup.fileValue
        }

        return this.updateThemeFile(asset);
      })
      .catch(error => alert(error));

  }

  getBackupThemeFile = (id) => {
    return fetch(`/api/themes/${id}/backup`, {
      method: 'GET',
    }).then(response => response.json())
      .then(json => json)
      .catch(error => alert(error));
  }

  updateThemeFile = (asset) => {

    const fetchURL = `/api/themes/${this.state.activeTheme.id}/config`;
    const options = {
      method: 'PUT',
      body: JSON.stringify({ asset })
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => alert(error));
  }

  setSelectedItems = (items) => {

    this.setState({
      selectedItems: items,
    });
  };

  deleteThemeSchedules = () => {

    const { selectedItems, scheduleList } = this.state;

    for (var i = 0; i < selectedItems.length; i++) {

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

          const newScheduleList = scheduleList.filter(schedule => schedule.id !== data.scheduleId);
          this.setState({ scheduleList: newScheduleList });

          return json;
        })
        .catch(error => alert(error));
    }

  }

}

export default ThemeSchedules;
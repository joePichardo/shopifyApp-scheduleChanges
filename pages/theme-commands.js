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
  Select,
  Frame,
  Toast
} from '@shopify/polaris';
var _ = require('lodash');

class ThemeCommands extends React.Component {
  state = {
    toastActive: false,
    toastContent: "",
    toastError: false,
    loadingScheduleSubmit: false,
    loadingThemeUpdate: false,
    activeTheme: {},
    stagingThemeName: 'Staging-Debut',
    stagingTheme: {},
    selectedDate: new Date(),
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    selectedHour: '00',
    selectedMinute: '00',
    scheduleDescription: "",
    hourOptions: [
      { label: '12 am', value: '00' },
      { label: '1 am', value: '01' },
      { label: '2 am', value: '02' },
      { label: '3 am', value: '03' },
      { label: '4 am', value: '04' },
      { label: '5 am', value: '05' },
      { label: '6 am', value: '06' },
      { label: '7 am', value: '07' },
      { label: '8 am', value: '08' },
      { label: '9 am', value: '09' },
      { label: '10 am', value: '10' },
      { label: '11 am', value: '11' },
      { label: '12 pm', value: '12' },
      { label: '1 pm', value: '13' },
      { label: '2 pm', value: '14' },
      { label: '3 pm', value: '15' },
      { label: '4 pm', value: '16' },
      { label: '5 pm', value: '17' },
      { label: '6 pm', value: '18' },
      { label: '7 pm', value: '19' },
      { label: '8 pm', value: '20' },
      { label: '9 pm', value: '21' },
      { label: '10 pm', value: '22' },
      { label: '11 pm', value: '23' },
    ],
    minuteOptions: [
      { label: '00', value: '00' },
      { label: '15', value: '15' },
      { label: '30', value: '30' },
      { label: '45', value: '45' },
    ],
  };

  render() {

    const { toastActive, toastContent, toastError } = this.state;

    const toastMarkup = toastActive ? (
      <Toast content={toastContent} error={toastError} onDismiss={this.toggleToastActive} />
    ) : null;

    const { stagingThemeName, selectedDate, minuteOptions, hourOptions, selectedMinute, selectedHour, scheduleDescription } = this.state;
    const today = new Date()
    const yesterday = new Date(today)

    yesterday.setDate(yesterday.getDate() - 1)

    return (
      <Frame>
        <Page>
          <Layout>
            <Layout.AnnotatedSection
              title="Name of theme to update from"
              description="Copy your theme and rename it. This is the theme where you will be updating from. We recommended renaming duplicated them with 'Staging-' as a prefix. * Make sure the name is unique from other themes *"
            >
              <Card sectioned>
                <Form onSubmit={this.handleSubmit}>
                  <FormLayout>
                    <TextField
                      value={stagingThemeName}
                      onChange={this.handleChange('stagingThemeName')}
                      label="Theme Name"
                      type="text"
                    />
                    <Stack distribution="trailing">
                      <Button primary submit>
                        Save
                      </Button>
                    </Stack>
                  </FormLayout>
                </Form>
              </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection
              title="Schedule a date and time for the settings to be changed/updated"
              description="Make sure you have reviewed your changes before scheduling a change. Your staging theme will be saved in it's current state and updated at the scheduled time."
            >
              <Card sectioned>
                <Form onSubmit={this.handleScheduleSubmit}>
                  <FormLayout>
                    <DatePicker
                      month={this.state.selectedMonth}
                      onMonthChange={this.handleChange('selectedMonth')}
                      year={this.state.selectedYear}
                      onChange={this.handleChange('selectedDate')}
                      selected={selectedDate}
                      allowRange={false}
                      disableDatesBefore={yesterday}
                    />
                    <FormLayout.Group>
                      <Select
                        label="Hour"
                        options={hourOptions}
                        onChange={this.handleChange('selectedHour')}
                        value={selectedHour}
                      />
                      <Select
                        label="Minute"
                        options={minuteOptions}
                        onChange={this.handleChange('selectedMinute')}
                        value={selectedMinute}
                      />
                    </FormLayout.Group>
                    <TextField
                      value={scheduleDescription}
                      onChange={this.handleChange('scheduleDescription')}
                      label="Scheduled change description"
                      type="text"
                    />
                    <Stack distribution="trailing">
                      <Button primary loading={this.state.loadingScheduleSubmit} submit>
                        Save
                      </Button>
                    </Stack>
                  </FormLayout>
                </Form>
              </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection
              title="Update Now"
              description="Update changes on your staging theme to the live theme."
            >
              <Form onSubmit={this.handleThemeUpdate}>
                <FormLayout>
                  <Stack distribution="trailing">
                    <Button loading={this.state.loadingThemeUpdate} primary submit>
                      Update Theme Now
                    </Button>
                  </Stack>
                </FormLayout>
              </Form>
            </Layout.AnnotatedSection>
          </Layout>
          {toastMarkup}
        </Page>
      </Frame>
    );
  }

  handleSubmit = () => {
    this.setState({
      stagingThemeName: this.state.stagingThemeName,
    });
    console.log('submission staging theme', this.state);

  };

  handleScheduleSubmit = async () => {

    this.setState({ loadingScheduleSubmit: true }, async () => {
      const { selectedDate, selectedMonth, selectedYear, selectedHour, selectedMinute, scheduleDescription } = this.state;

      var dateRetrieved, scheduleBackupId;

      if (selectedDate.start) {
        dateRetrieved = selectedDate.start;
      } else {
        dateRetrieved = selectedDate;
      }


      var scheduledDay = new Date(selectedYear, selectedMonth, dateRetrieved.getDate(), selectedHour, selectedMinute);

      const response = await this.getThemeList()
        .then(json => {
          return this.findCurrentThemes(json);
        }).then(themesFound => {

          if (!themesFound) {
            throw new Error('Did not find current themes');
          }

          return this.getThemeFileById(this.state.activeTheme.id);
        }).then(json => {
          const asset = {
            key: json.data.asset.key,
            value: json.data.asset.value
          }

          return this.backupThemeFile({ themeId: json.data.themeId, data: asset });
        }).then(({ data }) => {

          scheduleBackupId = data.themeBackup.id;

          return this.getThemeFileById(this.state.stagingTheme.id);
        }).then(json => {
          const asset = {
            key: json.data.asset.key,
            value: json.data.asset.value
          }

          return this.scheduleThemeFile({ date: scheduledDay.toISOString(), backupId: scheduleBackupId, asset, description: scheduleDescription });
        }).then(() => {
          this.setState({
            scheduleDescription: "",
            loadingScheduleSubmit: false
          });
          this.fetchSuccess("Successfully scheduled change!")
          return true;
        })
        .catch(error => {
          this.setState({
            loadingScheduleSubmit: false
          });

          this.fetchFailed(error)
        });
    });

  };

  findCurrentThemes = (json) => {
    const { stagingThemeName } = this.state;

    if (json.data.themes !== undefined) {
      var themes = json.data.themes;
      themes.forEach((theme) => {
        if (theme.name === stagingThemeName) {
          this.setState({
            stagingTheme: theme,
          });
        }

        if (theme.role === "main") {
          this.setState({
            activeTheme: theme,
          });
        }
      })
    }

    if (_.isEmpty(this.state.stagingTheme) ) {
      throw new Error('Did not find staging theme');
    }

    if(_.isEmpty(this.state.activeTheme)) {
      throw new Error('Did not find active theme');
    }

    return true;
  }

  handleThemeUpdate = async () => {

    this.setState({ loadingThemeUpdate: true }, async () => {
      const { stagingThemeName } = this.state;

      const response = await this.getThemeList()
        .then(json => {
          return this.findCurrentThemes(json);
        }).then(themesFound => {

          if (!themesFound) {
            throw new Error('Did not find current themes');
          }

          return this.getThemeFileById(this.state.stagingTheme.id);
        }).then(json => {
          const asset = {
            key: json.data.asset.key,
            value: json.data.asset.value
          }
          return this.updateThemeFile(asset);
        }).then(() => {
          this.setState({
            loadingThemeUpdate: false
          });
          this.fetchSuccess("Successfully updated live theme!")
        })
        .catch(error => {
          this.setState({
            loadingThemeUpdate: false
          });
          this.fetchFailed(error)
        });
    });

  };

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

  getThemeFileById = (id) => {
    return fetch(`/api/themes/${id}/config`, {
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

  backupThemeFile = ({ themeId, data }) => {

    const fetchURL = `/api/themes/${themeId}/backup`;
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => alert(error));
  }

  scheduleThemeFile = (schedule) => {

    const fetchURL = `/api/themes/${this.state.stagingTheme.id}/schedule`;
    const options = {
      method: 'POST',
      body: JSON.stringify(schedule)
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => alert(error));
  }

  handleChange = (field) => {
    return (value) => this.setState({ [field]: value });
  };

  showToast = (text, error) => {
    this.setState({
      toastActive: !this.state.toastActive,
      toastContent: text,
      toastError: error
    });
  }

  toggleToastActive = () => {
    this.setState({
      toastActive: !this.state.toastActive,
    });
  }

  fetchFailed = (error) => {
    this.setState({
      loadingSchedules: false
    });
    this.showToast(error, true);
  }

  fetchSuccess = (message) => {
    this.setState({
      loadingSchedules: false
    });
    this.showToast(message, false);
  }

}

export default ThemeCommands;
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
} from '@shopify/polaris';
var _ = require('lodash');

class ThemeCommands extends React.Component {
  state = {
    activeTheme: {},
    stagingThemeName: 'Staging-Debut',
    stagingTheme: {}
  };

  render() {
    const { stagingThemeName } = this.state;

    return (
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
            title="Update Now"
            description="Update changes on your staging theme to the live theme."
          >
            <Form onSubmit={this.handleThemeUpdate}>
              <FormLayout>
                <Stack distribution="trailing">
                  <Button primary submit>
                    Update Theme Now
                  </Button>
                </Stack>
              </FormLayout>
            </Form>
          </Layout.AnnotatedSection>
        </Layout>
      </Page>
    );
  }

  handleSubmit = () => {
    this.setState({
      stagingThemeName: this.state.stagingThemeName,
    });
    console.log('submission staging theme', this.state);

  };

  handleThemeUpdate = async () => {
    console.log('handle theme update')
    const { stagingThemeName } = this.state;

    const response = await fetch(`/api/themes`, {
      method: 'GET',
    }).then(response => response.json())
      .then(json => {

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

        return this.getThemeFile();
      }).then(json => {
        const asset = {
          key: json.data.asset.key,
          value: json.data.asset.value
        }
      return this.updateThemeFile(asset);
    })
      .catch(error => alert(error));

  };

  getThemeFile = () => {
    return fetch(`/api/themes/${this.state.stagingTheme.id}/config`, {
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

  handleChange = (field) => {
    return (value) => this.setState({ [field]: value });
  };

}

export default ThemeCommands;